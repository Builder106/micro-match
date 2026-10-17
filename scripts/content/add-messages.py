import json, sys
path = 'messages/en.json'
data = json.load(open(path))
new = json.load(open(sys.argv[1]))
clash = [k for k in new if k in data and data[k] != new[k]]
data.update(new)
json.dump(data, open(path, 'w'), ensure_ascii=False, indent=2)
open(path, 'a').write('\n')
print(f'added {len(new)} keys; replaced {len(clash)}: {clash}')
