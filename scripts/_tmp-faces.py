import os, json, requests
DIR = "public/uploads/keyshozorii"
ok, bad = [], []
files = sorted(f for f in os.listdir(DIR) if f.lower().endswith((".jpg",".jpeg",".png",".webp")))
for i, f in enumerate(files):
    with open(os.path.join(DIR, f), "rb") as fh:
        try:
            r = requests.post("http://127.0.0.1:8100/detect", files={"image": fh}, timeout=20)
            d = r.json()
        except Exception as e:
            d = {"faces": 0, "score": 0}
    (ok if d.get("faces",0) >= 1 and d.get("score",0) >= 0.5 else bad).append((f, d.get("score",0)))
    if i % 50 == 0: print(i, "ok:", len(ok))
json.dump({"ok":[f for f,_ in ok], "bad":bad}, open("scripts/_faces.json","w"))
print("TOTAL ok:", len(ok), "bad:", len(bad))
