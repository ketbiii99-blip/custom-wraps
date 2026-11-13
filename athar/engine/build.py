"""Builds one episode end to end.
usage: python3 engine/build.py ep02 <dir with trimmed voice clips named <clip>.wav> [clip=altclip ...]
Steps: timeline from clip lengths -> master the voice (exciter, spectral match to studio references, gate,
compressor, de-esser, level) -> ambient bed -> mix -> render video -> post-kit folder with reel and cover."""
import json, os, subprocess, sys, shutil, re
ep, clips = sys.argv[1], sys.argv[2]
alt = dict(a.split('=') for a in sys.argv[3:])
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(root)
run = lambda *a, **k: subprocess.run(a, check=True, **k)
spec = json.load(open(f'episodes/src/{ep}.json', encoding='utf-8'))
ids = [str(b['clip']) for b in spec['beats'] if 'clip' in b]
src = {i: os.path.join(clips, alt.get(i, i) + '.wav') for i in ids}
def dur(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
work = f'out/_{ep}'; shutil.rmtree(work, ignore_errors=True); os.makedirs(work + '/ex'); os.makedirs(work + '/mt')
json.dump({i: dur(f) for i, f in src.items()}, open(work + '/dur.json', 'w'))
run('python3', 'engine/timeline.py', f'episodes/src/{ep}.json', work + '/dur.json')
E = json.loads(open(f'episodes/{ep}.js', encoding='utf-8').read().split('window.EPISODE = ', 1)[1].rstrip().rstrip(';'))
for i, f in src.items():
    run('ffmpeg', '-v', 'error', '-y', '-i', f, '-af', 'highpass=f=95:poles=2,afftdn=nr=12:nf=-52,aexciter=level_in=1:level_out=1:amount=3:drive=8.5:blend=0:freq=5500:ceil=16000:listen=0', f'{work}/ex/{i}.wav')
run('python3', 'engine/voice_match.py', 'engine/ref/studio_a.mp3,engine/ref/studio_b.mp3', work + '/mt', *[f'{work}/ex/{i}.wav' for i in ids], stdout=subprocess.DEVNULL)
for i in ids:
    run('ffmpeg', '-v', 'error', '-y', '-i', f'{work}/mt/{i}.wav', '-af', 'agate=threshold=0.006:ratio=3:attack=5:release=180:range=0.12,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=1,deesser=i=0.3,afade=t=in:d=0.02,areverse,afade=t=in:d=0.06,areverse', f'{work}/c{i}.wav')
    m = float(re.search(r'mean_volume: ([-0-9.]+)', subprocess.run(['ffmpeg', '-i', f'{work}/c{i}.wav', '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr).group(1))
    run('ffmpeg', '-v', 'error', '-y', '-i', f'{work}/c{i}.wav', '-af', f'volume={-17 - m:.2f}dB,alimiter=limit=0.9', f'{work}/v{i}.wav')
A = E['action']
run('python3', 'engine/audio.py', work + '/amb.wav', str(E['duration']), str(A['stopAt']), str(A['resumeAt']), str(A['rewardAt']), E.get('scene', {}).get('sound', 'rustle'), stdout=subprocess.DEVNULL)
inputs = ['-i', work + '/amb.wav']; fc = ['[0]volume=0.6[a]']; labels = []
for n, v in enumerate(E['voice'], 1):
    inputs += ['-i', f"{work}/v{v['clip']}.wav"]; fc.append(f"[{n}]adelay={int(v['at'] * 1000)}:all=1[s{n}]"); labels.append(f'[s{n}]')
fc.append(''.join(labels) + f'amix=inputs={len(labels)}:normalize=0,pan=stereo|c0=c0|c1=c0[v]'); fc.append('[a][v]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[o]')
run('ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(fc), '-map', '[o]', '-ar', '44100', f'out/{ep}.wav')
run('node', 'engine/render.mjs', ep, stdout=subprocess.DEVNULL)
kit = f'post-kit/{ep}'; os.makedirs(kit, exist_ok=True)
hook_end = E['voice'][1]['at'] - 0.9
run('node', 'engine/render.mjs', ep, '--stills', f'{hook_end:.1f}')
shutil.move(f'out/{ep}_t{hook_end:.1f}.jpg', f'{kit}/cover.jpg'); shutil.copy(f'out/{ep}.mp4', f'{kit}/athar_{ep}.mp4')
os.remove(f'out/{ep}.wav'); shutil.rmtree(work)
lv = [re.search(r'mean_volume: ([-0-9.]+)', subprocess.run(['ffmpeg', '-ss', str(v['at']), '-t', '2.5', '-i', f'out/{ep}.mp4', '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr).group(1) for v in E['voice']]
print(ep, 'done', E['duration'], 's; loudness per line:', ' '.join(lv))
