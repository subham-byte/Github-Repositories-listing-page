const apiUrl = 'https://api.github.com/users/';
let perPage = 10;
let currentPage = 1;
let totalRepos = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadRepositories();
});


function loadRepositories(username) {
    const loader = document.getElementById('loader');
    const repositoriesContainer = document.getElementById('repositories');
    const paginationContainer = document.getElementById('pagination');
    const userInfoContainer = document.getElementById('user-info');

    loader.style.display = 'block';

    const fetchReposPage = (page) => {
        return fetch(`${apiUrl}${username}/repos?per_page=10&page=${page}`, {
            headers: {
                Authorization: 'Bearer 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', // Replace with your actual GitHub personal access token
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
    };

    // Fetch user details
    fetch(`${apiUrl}${username}`, {
        headers: {
            Authorization: 'Bearer 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', // Replace with your actual GitHub personal access token
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(user => {
        displayUserInfo(user);
        userInfoContainer.style.display = 'flex'; // Show user info container

        // Fetch all repositories pages
        const fetchAllPages = async () => {
            const allRepos = [];
            let page = 1;

            while (true) {
                const repos = await fetchReposPage(page);
                if (repos.length === 0) {
                    break;
                }
                allRepos.push(...repos);
                page++;
            }

            return allRepos;
        };

        return fetchAllPages();
    })
    .then(repositories => {
        // Fetch languages for each repository
        const languagesPromises = repositories.map(repo =>
            fetch(`${apiUrl}${username}/${repo.name}/languages`, {
                headers: {
                    Authorization: 'Bearer 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', // Replace with your actual GitHub personal access token
                },
            })
            .then(response => {
                if (!response.ok) {
                    // Handle 404 or other error status codes
                    console.error(`Error fetching languages for ${repo.name}: ${response.status} ${response.statusText}`);
                    return {};
                }
                return response.json();
            })
        );
        

        // Wait for all languages to be fetched
        return Promise.all(languagesPromises).then(languagesData => {
            // Add languages data to each repository
            repositories.forEach((repo, index) => {
                repo.languages = Object.keys(languagesData[index]); // Extract language names
            });

            loader.style.display = 'none';
            displayRepositories(repositories.slice(0, 10)); // Display only the first 10 repositories
            displayPagination(username, repositories.length);
        });
    })
    .catch(error => {
        loader.style.display = 'none';
        console.error('Error fetching data:', error);
    });
}

function fetchAllPages(username, perPage = 100, page = 1, allRepositories = []) {
    return fetch(`${apiUrl}${username}/repos?per_page=${perPage}&page=${page}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json().then(repositories => {
                allRepositories = allRepositories.concat(repositories.map(repo => ({
                    name: repo.name,
                    description: repo.description || 'No description'
                })));

                const linkHeader = response.headers.get('Link');
                if (linkHeader && linkHeader.includes('rel="next"')) {
                    const nextPage = parseInt(linkHeader.split(',').find(s => s.includes('rel="next"')).split('&page=')[1]);
                    return fetchAllPages(username, perPage, nextPage, allRepositories);
                } else {
                    return allRepositories;
                }
            });
        });
}




function searchUser() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();

    if (username === '') {
        alert('Please enter a GitHub username');
        return;
    }

    // load repositories for the entered user
    loadRepositories(username);
}

function displayUserInfo(user) {
    const avatarElement = document.getElementById('avatar');
    const userNameElement = document.getElementById('user-name');
    const userDescriptionElement = document.getElementById('user-description');
    const userLocationElement = document.getElementById('user-location');
    const githubLinkElement = document.getElementById('github-link');

    avatarElement.src = user.avatar_url;
    userNameElement.innerText = user.name || user.login;
    userDescriptionElement.innerText = user.bio || 'No description';
    userLocationElement.innerText = user.location ? `Location: ${user.location}` : '';
    githubLinkElement.innerHTML = user.html_url ? `<a href="${user.html_url}" target="_blank">GitHub Profile</a>` : '';
}


function displayRepositories(repositories) {
    const repositoriesContainer = document.getElementById('repositories');
    repositoriesContainer.innerHTML = '';

    repositories.forEach(repo => {
        const repoElement = document.createElement('div');
        repoElement.classList.add('repository-box', 'repo');
        repoElement.innerHTML = `
            <div class="repository-header">
                <div class="repository-name">${repo.name}</div>
                <div class="repository-description">${repo.description || 'No description'}</div>
            </div>
            <div class="repository-details">
                <div class="repository-topics">${repo.topics ? `Topics: ${repo.topics.join(', ')}` : 'No topics'}</div>
            </div>
        `;
        repoElement.addEventListener('click', () => {
            repoElement.classList.toggle('highlight');
        });
        repositoriesContainer.appendChild(repoElement);
    });
}


function displayPagination(username, totalRepos) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalRepos / perPage);

    console.log('currentPage:', currentPage);
    console.log('totalPages:', totalPages);

    if (totalPages > 1) {
        const prevButton = document.createElement('button');
        prevButton.innerText = '<<';
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadRepositories(username);
            }
        });
        paginationContainer.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.innerText = i;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                loadRepositories(username);
            });
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.innerText = '>>';
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadRepositories(username);
            }
        });
        paginationContainer.appendChild(nextButton);
    }

    console.log('currentPage after loop:', currentPage);
    console.log('totalPages after loop:', totalPages);
}




function searchRepositories() {
    const searchInput = document.getElementById('search');
    const searchTerm = searchInput.value.trim();

    if (searchTerm === '') {
        loadRepositories();
        return;
    }

    const username = document.getElementById('username').value.trim();

    const loader = document.getElementById('loader');
    const repositoriesContainer = document.getElementById('repositories');
    const paginationContainer = document.getElementById('pagination');

    loader.style.display = 'block';

    fetch(`${apiUrl}${username}/repos?per_page=${perPage}&page=${currentPage}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            totalRepos = parseInt(response.headers.get('Link').split(',').find(s => s.includes('rel="last"')).split('&page=')[1]);
            return response.json();
        })
        .then(repositories => {
            const filteredRepositories = repositories.filter(repo => repo.name.includes(searchTerm));
            loader.style.display = 'none';
            displayRepositories(filteredRepositories);
            displayPagination();
        })
        .catch(error => {
            loader.style.display = 'none';
            console.error('Error fetching repositories:', error);
        });
}


function updatePerPage(value) {
    perPage = value;
    currentPage = 1;
    totalRepos = 0; // Reset totalRepos to recalculate with the new perPage value
    const username = document.getElementById('username').value.trim();
    loadRepositories(username);
    console.log('Updated totalRepos:', totalRepos);
}