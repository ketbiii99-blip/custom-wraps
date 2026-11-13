"""Spectral matching: python3 match.py ref1[,ref2] out_dir in1.wav in2.wav ...
Computes one EQ curve that moves the average spectrum of all inputs onto the reference voices, applies it to each."""
import sys, subprocess, wave, os, numpy as np
SR=44100
def load(f):
    raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar",str(SR),"-f","s16le","-"],capture_output=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(float)/32768
def ltas(x, n=4096):
    fr = x[:len(x)//n*n].reshape(-1,n); e=(fr**2).mean(1); fr=fr[e>np.percentile(e,40)]
    return (np.abs(np.fft.rfft(fr*np.hanning(n),axis=1))**2).mean(0)
fq = np.fft.rfftfreq(4096,1/SR)
cent = 80*2**(np.arange(0,24)/3.0); cent=cent[cent<17000]
def bands(P):
    out=[]
    for c in cent:
        m=(fq>=c/2**(1/6))&(fq<c*2**(1/6)); out.append(10*np.log10(P[m].mean()+1e-15))
    return np.array(out)
refs=[bands(ltas(load(r))) for r in sys.argv[1].split(",")]; ref=np.mean([r-r[(cent>200)&(cent<4000)].mean() for r in refs],0)
ins=sys.argv[3:]; xs=[load(f) for f in ins]
src=bands(ltas(np.concatenate(xs))); src-=src[(cent>200)&(cent<4000)].mean()
g=np.clip(ref-src,-12,12); g=np.convolve(np.pad(g,1,mode="edge"),[.25,.5,.25],"valid")
print("EQ curve:", " ".join("%d:%+.1f"%(c,v) for c,v in zip(cent,g)))
N=2048; H=N//4; w=np.hanning(N); bf=np.fft.rfftfreq(N,1/SR)
G=10**(np.interp(np.log(np.maximum(bf,20)),np.log(cent),g)/20); G[bf<70]=0.1
for f,x in zip(ins,xs):
    x=np.pad(x,(N,N)); y=np.zeros(len(x)); ws=np.zeros(len(x))
    for i in range(0,len(x)-N,H):
        y[i:i+N]+=np.fft.irfft(np.fft.rfft(x[i:i+N]*w)*G)*w; ws[i:i+N]+=w*w
    y=(y/np.maximum(ws,1e-6))[N:-N]; y=y/max(1,np.abs(y).max()/0.95)
    with wave.open(os.path.join(sys.argv[2],os.path.basename(f)),"wb") as o:
        o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes((y*32767).astype("<i2").tobytes())
