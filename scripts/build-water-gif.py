"""Create the small, finite water-outage icon used beside the dated notice."""
from pathlib import Path
from PIL import Image, ImageDraw
import math
OUT = Path(__file__).resolve().parents[1] / 'public'
frames=[]
for n in range(30):
    im=Image.new('RGB',(288,288),'white'); d=ImageDraw.Draw(im)
    def box(b,fill,r=0):
        b=tuple(round(v*3) for v in b)
        d.rounded_rectangle(b,radius=round(r*3),fill=fill)
    d.ellipse((9,9,279,279),fill='#eef7fa')
    box((20,36,60,50),'#316880',5)
    box((20,34,30,65),'#316880',3)
    box((51,37,64,58),'#316880',3)
    box((38,25,46,39),'#316880',2)
    box((30,24,54,29),'#316880',2)
    box((17,59,33,64),'#234c60',2)
    if n<17:
        phase=(n%9)/9
        x,y=58,61+phase*16
        d.polygon([(x*3,(y-5)*3),((x-3)*3,y*3),((x+3)*3,y*3)],fill='#279ac4')
        d.ellipse(((x-3)*3,(y-2)*3,(x+3)*3,(y+4)*3),fill='#279ac4')
    # The persistent no-water sign remains clearly visible after the motion stops.
    d.ellipse((174,153,258,237),fill='white',outline='#d54c43',width=9)
    d.line((186,225,246,165),fill='#d54c43',width=9)
    frames.append(im.resize((96,96),Image.Resampling.LANCZOS))
OUT.mkdir(exist_ok=True)
frames[-1].save(OUT/'water-outage-static.png')
frames[0].save(OUT/'water-outage.gif',save_all=True,append_images=frames[1:],duration=100,disposal=2,optimize=True)
print('GIF:',Image.open(OUT/'water-outage.gif').n_frames,'frames; no continuous looping')
