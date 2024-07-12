import json

def is_valid_json(data):
    try:
        json.loads(json.dumps(data))
        return True
    except json.JSONDecodeError:
        print("Cannot parse JSON. Data is not valid.")
        return False

class PostsManager:
    def __init__(self, filename):
        self.filename = filename


    def get_posts(self):
        try:
            with open(self.filename, "r") as open_file:
                data = json.load(open_file)
            return data
        except FileNotFoundError as e:
            print("File doesn't exist. Please try again.", str(e))


    def add_post(self, post):
        data = self.get_posts()
        if is_valid_json(data):
            data.append(post)
            with open(self.filename, "w") as update_file:
                json.dump(data, update_file, indent=4)


    def update_post(self, post):
        data = self.get_posts()
        if is_valid_json(data):
            post_index = next(i for i, item in enumerate(data) if item["id"] == post["id"])
            data[post_index] = post
            with open(self.filename, "w") as update_file:
                json.dump(data, update_file, indent=4)


    def delete_post(self, post):
        data = self.get_posts()
        if is_valid_json(data):
            data.remove(post)
            with open(self.filename, "w") as update_file:
                json.dump(data, update_file, indent=4)
        