// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
// Secure external links opened in new tab
Array.from(document.querySelectorAll('a[target="_blank"]')).forEach(a => {
    if (!a.rel) a.rel = 'noopener noreferrer';
    else if (!a.rel.includes('noopener')) a.rel += ' noopener';
    else if (!a.rel.includes('noreferrer')) a.rel += ' noreferrer';
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Fetch GitHub repositories
async function fetchGitHubProjects() {
    const username = 'WeiProduct';
    const projectsContainer = document.getElementById('github-projects');
    if (!projectsContainer) { return; }
    
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=12`);
        const repos = await response.json();
        
        if (response.ok) {
            displayProjects(repos);
        } else {
            projectsContainer.innerHTML = '<p>Unable to load GitHub projects at this time.</p>';
        }
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
        projectsContainer.innerHTML = '<p>Unable to load GitHub projects at this time.</p>';
    }
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function displayProjects(repos) {
    const projectsContainer = document.getElementById('github-projects');
    if (!projectsContainer) { return; }
    
    repos.forEach(repo => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        
        const lang = repo.language ? escapeHTML(repo.language) : null;
        const languages = lang ? `<span class="project-language">${lang}</span>` : '';
        const description = escapeHTML(repo.description || 'No description available');
        
        projectCard.innerHTML = `
            <h3>${escapeHTML(repo.name)}</h3>
            <p>${description}</p>
            ${languages}
            <div class="project-links">
                <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
                    <i class="fab fa-github"></i> View on GitHub
                </a>
                ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i> Live Demo
                </a>` : ''}
            </div>
        `;
        
        projectsContainer.appendChild(projectCard);
    });
}

// Add styles for project language tags
const style = document.createElement('style');
style.textContent = `
    .project-language {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: var(--primary-color);
        color: #ffffff;
        border-radius: 20px;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }
`;
document.head.appendChild(style);

// Load GitHub projects when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchGitHubProjects();
});

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});