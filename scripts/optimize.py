from pathlib import Path
from PIL import Image,ImageOps
root=Path(__file__).resolve().parents[1]
out=root/'public/assets/projects';out.mkdir(parents=True,exist_ok=True)
for p in sorted((root.parent/'source/images').glob('*')):
 if p.suffix.lower() not in ['.png','.jpg','.jpeg']:continue
 try:
  with Image.open(p) as raw:
   im=ImageOps.exif_transpose(raw).convert('RGB')
   for suffix,width,q in [('',1800,84),('-sm',640,78)]:
    dest=out/(p.stem+suffix+'.webp')
    if dest.exists():continue
    cp=im.copy();cp.thumbnail((width,width));cp.save(dest,'WEBP',quality=q,method=4)
 except Exception as e:print(p.name,e)
print('Files:',len(list(out.glob('*.webp'))))
