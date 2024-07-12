from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from posts_manager import PostsManager

app = Flask(__name__)
CORS(app)


posts = PostsManager("backend/posts.json")


def find_post_by_id(id):
    # Find the blog post with the given id, return None if there's no post
    for post in posts.get_posts():
        if post['id'] == int(id):
            post_data = post
            break
    else:
        post_data = None

    return post_data


@app.route("/api/posts", methods=["GET", "POST"])
def get_posts():
    posts_list = posts.get_posts()
    sort = request.args.get('sort')
    direction = request.args.get('direction')

    if sort and direction:
        # If url parameters are are present, check if parameter values are valid
        if sort == "title" or sort == "content" or sort == "author" or sort == "date":
            if direction == "asc" or direction == "desc":
                # If they are, sort posts by the parameter and direction
                if sort == "title":
                    if direction == "asc":
                        sorted_posts = sorted(posts.get_posts(), key=lambda post: post['title'])
                    elif direction == "desc":
                        sorted_posts = sorted(posts.get_posts(), key=lambda post: post['title'], reverse=True)
                elif sort == "content":
                    if direction == "asc":
                        sorted_posts = sorted(posts.get_posts(), key=lambda post: post['content'])
                    elif direction == "desc":
                        sorted_posts = sorted(posts.get_posts(), key=lambda post: post['content'], reverse=True)
                elif sort == "author":
                    if direction == "asc":
                        sorted_posts = sorted(posts.get_posts(), key=lambda post: post['author'])
                    elif direction == "desc":
                        sorted_posts = sorted(posts.get_posts(), key=lambda post: post['author'], reverse=True)
                elif sort == "date":
                    if direction == "asc":
                        sorted_posts = sorted(posts.get_posts(), key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d'))
                    elif direction == "desc":
                        sorted_posts = sorted(posts.get_posts(), key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d'), reverse=True)
                return jsonify(sorted_posts)
            else:
                msg = { "message": "Invalid direction. Must be 'asc' or 'desc'." }
                return jsonify(msg), 400
        else:
            msg = { "message": "Invalid sort. Must be 'title', 'content', 'author', or 'date'." }
            return jsonify(msg), 400
    else:
        if request.method == "POST":
            # Get new post data from the client
            new_post = request.get_json()

            # If one or more fields are empty, throw an error
            # Otherwise, process form data into new post
            empty_fields = [field for field, value in new_post.items() if not value]
            if empty_fields:
                msg = { "message": "Cannot add post. One or more fields are required." }
                return jsonify(msg), 400
            else:
                # Generate an id for the new post
                new_id = max(post['id'] for post in posts.get_posts()) + 1
                new_post['id'] = new_id

                # Append the new information to our list
                posts.add_post(new_post)

                # Return the new post data sent to the client
                return jsonify(new_post), 201
        else:
            # Handle the get request
            if posts_list:
                return jsonify(posts_list), 200
            else:
                msg = { "message": "Cannot get posts." }
                return jsonify(msg), 404


@app.route("/api/posts/<int:id>", methods=["GET", "DELETE"])
def delete_post(id):
    if request.method == "DELETE":
        # Get post by id
        del_post = find_post_by_id(id)

        if del_post is None:
            # If post id doesn't exist, return 404 error
            msg = { "message": "Cannot delete post. Post with id <id> doesn't exist." }
            return jsonify(msg), 404
        else:
            # If post does exist, delete post
            for post in posts.get_posts():
                if post['id'] == del_post['id']:
                    posts.delete_post(post)
                    break
            msg = { "message": "Post with id <id> has been successfully deleted." }

            return jsonify(msg), 200
    else:
        post = find_post_by_id(id)
        if post is None:
            msg = { "message": "Cannot get post. Post with id <id> doesn't exist." }
            return jsonify(msg), 404
        else:
            return jsonify(post), 200


@app.route("/api/posts/<int:id>", methods=["GET", "PUT"])
def update_post(id):
    if request.method == "PUT":
        # Get post by id
        edit_post = find_post_by_id(id)

        if edit_post is None:
            # If post doesn't exist, return 404 error
            msg = { "message": "Cannot edit post. Post with id <id> doesn't exist." }
            return jsonify(msg), 404
        else:
            # If post does exist, update post
            new_data = request.get_json()
            empty_fields = not bool(new_data.values())
            for post in posts.get_posts():
                if post['id'] == edit_post['id']:
                    # If one or more fields are empty, keep old data
                    # Else update with new data
                    if empty_fields:
                        post = edit_post
                    else:
                        new_data['id'] = edit_post['id']
                        if new_data.get('title') is None:
                            new_data['title'] = edit_post['title']
                        if new_data.get('content') is None:
                            new_data['content'] = edit_post['content']
                        if new_data.get('author') is None:
                            new_data['author'] = edit_post['author']
                        if new_data.get('date') is None:
                            new_data['date'] = edit_post['date']
                        post = new_data
                    posts.update_post(post)
                    break

            return jsonify(post), 200
    else:
        post = find_post_by_id(id)
        if post is None:
            msg = { "message": "Cannot get post. Post with id <id> doesn't exist." }
            return jsonify(msg), 404
        else:
            return jsonify(post), 200


@app.route("/api/posts/search", methods=["GET"])
def search_posts():
    # Get search term
    title = request.args.get('title')
    content = request.args.get('content')
    author = request.args.get('author')
    date = request.args.get('date')

    # If title, content, author, or date exist, search
    # Otherwise, return an empty list
    if title is not None:
        filtered_posts = [post for post in posts.get_posts()
                          if title.lower() in post['title'].lower()]
    elif content is not None:
        filtered_posts = [post for post in posts.get_posts()
                          if content.lower() in post['content'].lower()]
    elif author is not None:
        filtered_posts = [post for post in posts.get_posts()
                          if author.lower() in post['author'].lower()]
    elif date is not None:
        filtered_posts = [post for post in posts.get_posts()
                          if date in post['date']]
    else:
        filtered_posts = []

    return jsonify(filtered_posts)


if __name__ == "__main__":
    app.run("0.0.0.0", port=5002, debug=True)
