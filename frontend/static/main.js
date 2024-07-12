// Function that runs once the window is fully loaded
window.onload = function() {
    // Attempt to retrieve the API base URL from the local storage
    var savedBaseUrl = localStorage.getItem('apiBaseUrl');
    // If a base URL is found in local storage, load the posts
    if (savedBaseUrl) {
        document.getElementById('api-base-url').value = savedBaseUrl;
        loadPosts();
    }
}

function sortPosts(criteria, order) {
    // Make a GET request to posts endpoint with sort criteria and sort order
    return fetch(baseUrl + '/posts?sort=' + criteria + '&direction=' + order)
        .then(response => response.json())
        .catch((error) => console.error('Error:', error));
}

// Function to fetch all the posts from the API and display them on the page
function loadPosts() {
    // Retrieve the base URL from the input field and save it to local storage
    var baseUrl = document.getElementById('api-base-url').value;
    localStorage.setItem('apiBaseUrl', baseUrl);

    // Get sort criteria and order from the URL parameters
    var urlParams = new URLSearchParams(window.location.search);
    var sortCriteria = urlParams.get('sort');
    var sortOrder = urlParams.get('direction');

    // Use the Fetch API to send a GET request to the /posts endpoint
    fetch(baseUrl + '/posts')
        .then(response => response.json())  // Parse the JSON data from the response
        .then(data => {  // Once the data is ready, we can use it
            // Clear out the post container first
            const postContainer = document.getElementById('post-container');
            postContainer.innerHTML = '';

            // Check if the current page is the main posts page
            const isPostsPage = window.location.pathname === '/posts';

            // If the current page is the posts page, render the sort links
            if (isPostsPage && sortCriteria && sortOrder) {
                const sortLinksContainer = document.getElementById('post-sort');
                sortLinksContainer.innerHTML = '';
                sortLinksContainer.innerHTML = `
                    Sort by:&nbsp;&nbsp;
                    Title:
                    <a href="?sort=title&direction=asc">Asc</a>,
                    <a href="?sort=title&direction=desc">Desc</a>&nbsp;&#183;
                    Content:
                    <a href="?sort=content&direction=asc">Asc</a>,
                    <a href="?sort=content&direction=desc">Desc</a>&nbsp;&#183;
                    Author:
                    <a href="?sort=author&direction=asc">Asc</a>,
                    <a href="?sort=author&direction=desc">Desc</a>&nbsp;&#183;
                    Date:
                    <a href="?sort=date&direction=asc">Asc</a>,
                    <a href="?sort=date&direction=desc">Desc</a>
                `;
            }

            // If a sort criteria is selected, sort the posts
            if (sortCriteria && sortOrder) {
                data.sort((a, b) => {
                    if (sortOrder === 'asc') {
                        return a[sortCriteria].localeCompare(b[sortCriteria]);
                    } else {
                        return b[sortCriteria].localeCompare(a[sortCriteria]);
                    }
                });
            }

            // For each post in the response, create a new post element and add it to the page
            data.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'post';
                postDiv.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.date} by ${post.author}</p>
                    <p>${post.content}</p>
                    <button class="edit-btn" onclick="editPost(${post.id})">Edit</button>
                    <button class="del-btn" onclick="deletePost(${post.id})">Delete</button>
                `;
                postContainer.appendChild(postDiv);
            });
        })
        .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
}

// Function to send a POST request to the API to add a new post
function addPost() {
    // Retrieve the values from the input fields
    var baseUrl = document.getElementById('api-base-url').value;
    var postTitle = document.getElementById('post-title').value;
    var postDate = document.getElementById('post-date').value;
    var postAuthor = document.getElementById('post-author').value;
    var postContent = document.getElementById('post-content').value;

    // Use the Fetch API to send a POST request to the /posts endpoint
    fetch(baseUrl + '/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: postTitle, date: postDate, author: postAuthor, content: postContent })
    })
    .then(response => response.json())  // Parse the JSON data from the response
    .then(post => {
        console.log('Post added:', post);
        loadPosts(); // Reload the posts after adding a new one
    })
    .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
}

// Function to send a PUT request to the API to edit an existing post
function editPost(postId) {
    var baseUrl = document.getElementById('api-base-url').value;

    // Use the Fetch API to send a PUT request to the specific post's endpoint
    fetch(baseUrl + '/posts/' + postId)
        .then(response => response.json())  // Parse the JSON data from the response
        .then(data => { // Once the data is retrieved, we can use it
            // Clear out the post container first
            const postContainer = document.getElementById('post-container');
            postContainer.innerHTML = '';

            // Add the post data to the page
            postContainer.innerHTML = `
                <h2>Edit Post</h2>
                <form class="center">
                    <label for="edited-title">Title:</label>
                    <input type="text" id="edited-title" value="${data.title}"><br>
                    <label for="edited-date">Date:</label>
                    <input type="date" id="edited-date" value="${data.date}"><br>
                    <label for="edited-author">Author:</label>
                    <input type="text" id="edited-author" value="${data.author}"><br>
                    <label for="edited-content">Content:</label><br>
                    <textarea id="edited-content">${data.content}</textarea><br>
                    <button type="button" id="confirm-edit">Confirm</button>
                    <button type="button" id="cancel-edit">Cancel</button>
                </form>
            `;

            // Add an event listener to the confirm button
            document.getElementById('confirm-edit').addEventListener('click', function() {
                var postTitle = document.getElementById('edited-title').value;
                var postDate = document.getElementById('edited-date').value;
                var postAuthor = document.getElementById('edited-author').value;
                var postContent = document.getElementById('edited-content').value;

                // Use the Fetch API to send a PUT request to the specific post's endpoint
                fetch(baseUrl + '/posts/' + postId, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: postTitle, date: postDate, author: postAuthor, content: postContent })
                })
                .then(response => response.json())  // Parse the JSON data from the response
                .then(updatePost => {
                    console.log('Post updated:', updatePost);
                    loadPosts(); // Reload the posts after editing one
                })
                .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
            });

            document.getElementById('cancel-edit').addEventListener('click', function() {
                loadPosts(); // Reload the posts without editing
            });
        })
        .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
}

// Function to send a DELETE request to the API to delete a post
function deletePost(postId) {
    var baseUrl = document.getElementById('api-base-url').value;

    // Use the Fetch API to send a DELETE request to the specific post's endpoint
    fetch(baseUrl + '/posts/' + postId)
    .then(response => response.json()) //Parse the JSON from the response
    .then(data => { // Once the data is retrieved, we can use it
        // Clear out the post container first
        const postContainer = document.getElementById('post-container');
        postContainer.innerHTML = '';

        // Add the post data to the page
        postContainer.innerHTML = `
            <h2>Delete Post</h2>
            <p class="center">You are about to delete the following post:</p>
            <p class="center"><strong>Title:</strong> ${data.title}</p>
            <p class="center"><strong>Date:</strong> ${data.date}</p>
            <p class="center"><strong>Author:</strong> ${data.author}</p>
            <p class="center"><strong>Content:</strong><br>
            ${data.content}</p>
            <p class="warning center">Are you sure you want to delete this post?<br>
            This action cannot be undone.</p>
            <p class="center">
            <button type="button" id="confirm-delete">Confirm</button>
            <button type="button" id="cancel-delete">Cancel</button>
            </p>
        `;

        // Add an event listener to the confirm button
        document.getElementById('confirm-delete').addEventListener('click', function() {
            // Use the Fetch API to send a DELETE request to the specific post's endpoint
            fetch(baseUrl + '/posts/' + postId, {
                method: 'DELETE'
            })
            .then(response => {
                console.log('Post deleted:', postId);
                loadPosts(); // Reload the posts after deleting one
            })
            .catch(error => console.error('Error:', error)); // If an error occurs, log it to the console
        });

        document.getElementById('cancel-delete').addEventListener('click', function() {
            loadPosts(); // Reload the posts without deleting
        });
    })
    .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
}

// Function to send a GET request to the API to retrieve a specific post
function searchPosts() {
    var baseUrl = document.getElementById('api-base-url');
    var searchUrl = baseUrl + '/posts/search';
    var searchQuery = document.getElementById('search-query').value;
    var searchType = document.querySelector('input[name="search-type"]:checked').value;

    // Construct search parameters based on the selected search type
    var searchParams = '';
    if (searchType === 'title') {
        searchParams = 'title=' + searchQuery;
    } else if (searchType === 'content') {
        searchParams = 'content=' + searchQuery;
    } else if (searchType === 'author') {
        searchParams = 'author=' + searchQuery;
    } else if (searchType === 'date') {
        searchParams = 'date=' + searchQuery;
    }

    // Append search parameters to the search URL
    if (searchParams) {
        searchUrl += '?' + searchParams;
    }

    // Use the Fetch API to send a GET request to the search URL
    fetch(searchUrl)
        .then(response => response.json())  // Parse the JSON data from the response
        .then(data => {  // Once the data is ready, we can use it
            // Clear out the post container first
            const postContainer = document.getElementById('div');
            postContainer.innerHTML = '';

            // Display the search results
            data.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'post';
                postDiv.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>By ${post.author} on ${post.date}</p>
                    <p>${post.content}</p>
                    <button onclick="editPost(${post.id})">Edit</button>
                    <button onclick="deletePost(${post.id})">Delete</button>
                `;
                postContainer.appendChild(postDiv);
            });
        })
        .catch(error => console.error('Error:', error));  // If an error occurs, log it to the console
}
