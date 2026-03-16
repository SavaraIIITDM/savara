import json
import pprint

with open("event_details.json") as f:
    data = json.loads(f.read())


new = []
for dat in data:
    new.append(
        {
            "name": dat["event_name"],
            "type": dat["event_type"],
        }
    )

pprint.pprint(new)
print(len(new))
