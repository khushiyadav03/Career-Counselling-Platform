let GEMINI_API_KEY = 'AIzaSyDp1uF7lf8D0N1wxr5nV43lW1GCQqHAVlw'; // Replace with a valid key
let careerGoals = [];

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupChatbot();
    loadCareerGoals();
});

function setupEventListeners() {
    const goalsForm = document.getElementById('goals-form');
    const contactForm = document.getElementById('contact-form');
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');

    if (goalsForm) {
        goalsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            planCareer();
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendContactMessage();
        });
    }

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });

        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
            });
        });
    }
}

function setupChatbot() {
    const chatbotButton = document.getElementById('chatbot-button');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotInput = document.getElementById('chatbot-input');
    const closeButton = document.getElementById('close-chatbot');

    if (!chatbotButton || !chatbotWindow || !chatbotInput || !closeButton) {
        console.warn('Chatbot elements not found on this page.');
        return;
    }

    chatbotButton.addEventListener('click', () => {
        chatbotWindow.style.display = chatbotWindow.style.display === 'none' ? 'flex' : 'none';
        if (chatbotWindow.style.display === 'flex') chatbotInput.focus();
    });

    closeButton.addEventListener('click', () => {
        chatbotWindow.style.display = 'none';
    });

    // Add Clear Chat button
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-chat-button';
    clearButton.textContent = 'Clear Chat';
    clearButton.addEventListener('click', clearChat);
    chatbotWindow.querySelector('.chatbot-header').appendChild(clearButton);

    // Page-specific welcome message
    const page = window.location.pathname.includes('get-started.html') 
        ? 'get-started' 
        : window.location.pathname.includes('job-search.html') 
        ? 'job-search' 
        : window.location.pathname.includes('set-goals.html') 
        ? 'set-goals' 
        : 'home';
    
    let welcomeMessage;
    switch (page) {
        case 'get-started':
            welcomeMessage = 'Welcome to Get Started! I’m CareerBot, here to kickstart your career journey. Ask about next steps or try the Career Goals section!';
            break;
        case 'job-search':
            welcomeMessage = 'Welcome to Job Search! I’m CareerBot, ready to help you find your next role. Ask about job search strategies or use the form above!';
            break;
        case 'set-goals':
            welcomeMessage = 'Welcome to Set Goals! I’m CareerBot, here to help you define your career path. Use the form above or ask me for advice!';
            break;
        default:
            welcomeMessage = 'Hello! I’m CareerBot, here to guide you to career success. Ask about resumes, career paths, or visit the Job Search page!';
    }

    // Add welcome message
    addMessageToChat('bot', welcomeMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function clearChat() {
    const chatbotMessages = document.getElementById('chatbot-messages');
    if (chatbotMessages) {
        chatbotMessages.innerHTML = '';
        addMessageToChat('bot', 'Chat cleared! How can I assist you now?');
    }
}

function sendMessage() {
    const input = document.getElementById('chatbot-input');
    if (!input) return;

    const message = input.value.trim().toLowerCase();
    if (!message) return;

    // Add user message
    addMessageToChat('user', message);
    input.value = '';

    const typingIndicator = addMessageToChat('bot', '', true);

    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
        getGeminiResponse(message)
            .then(response => {
                typingIndicator.remove();
                addMessageToChat('bot', response);
            })
            .catch(() => {
                typingIndicator.remove();
                addMessageToChat('bot', getMockResponse(message));
            });
    } else {
        setTimeout(() => {
            typingIndicator.remove();
            addMessageToChat('bot', getMockResponse(message));
        }, 1000);
    }
}

function addMessageToChat(sender, message, isTyping = false) {
    const chatbotMessages = document.getElementById('chatbot-messages');
    if (!chatbotMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}${isTyping ? ' typing' : ''}`;
    if (isTyping) {
        const spinner = document.createElement('span');
        spinner.className = 'loading-spinner';
        messageDiv.appendChild(spinner);
        messageDiv.appendChild(document.createTextNode(' Thinking...'));
    } else {
        messageDiv.textContent = message;
    }
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return messageDiv;
}

async function getGeminiResponse(message) {
    const prompt = `You are CareerBot, a friendly and expert career counseling assistant. Respond clearly and helpfully in a professional tone. 
    Current career goals: ${JSON.stringify(careerGoals, null, 2)}. 
    User message: "${message}". 
    - If asked about a career field (e.g., "Is software engineering a good career?"), provide a career report in this format:
      Career Report:
      Field: [Field]
      Outlook: [Outlook]
      Tips: [Tips]
      Skills Needed: [Skills]
    - If asked to plan a career (e.g., "Plan my career in marketing"), say: "Please use the Career Goals section above!"
    - If asked for resume tips (e.g., "How do I improve my resume?"), list resume advice.
    - If asked about job search (e.g., "How do I find a job?"), say: "Visit the Job Search page for tailored tips!"
    - For greetings (e.g., "Hi"), respond warmly (e.g., "Hi there, future professional! How can I assist?").
    - For unrecognized inputs, say: "I’m here to help with your career. Could you clarify your question?"`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) throw new Error('Error fetching response');
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function getMockResponse(message) {
    const words = message.split(' ');
    const careerField = careerGoals[0]?.careerField || words.find(word => /^[A-Z]/.test(word)) || words[words.length - 1].replace('?', '').trim();

    if (message.includes('is') && (message.includes('good') || message.includes('career'))) {
        return `Career Report:
Field: ${careerField || 'Unknown'}
Outlook: Promising growth (mock data)
Tips: Network with professionals, gain relevant experience
Skills Needed: Problem-solving, communication (example)`;
    } else if (message.includes('plan') || message.includes('career in')) {
        setTimeout(() => window.location.hash = '#goals', 1000);
        return "Please use the Career Goals section above!";
    } else if (message.includes('resume') || message.includes('cv')) {
        return `Here are some resume tips:
- Tailor it to the job description.
- Highlight achievements with numbers (e.g., "Increased sales by 20%").
- Keep it concise, ideally one page.
- Use a clean, professional format.`;
    } else if (message.includes('job') && (message.includes('find') || message.includes('search'))) {
        return "Visit the Job Search page for tailored tips!";
    } else if (message.includes('skills') || message.includes('learn')) {
        return `To boost your career, consider learning:
- Communication and teamwork skills.
- Industry-specific tools (e.g., Python for tech, Excel for finance).
- Time management and adaptability.
Where to learn: Coursera, Udemy, or free online resources!`;
    } else if (message.includes('hi') || message.includes('hello')) {
        return "Hi there, future professional! How can I assist you today?";
    } else if (message.includes('bye') || message.includes('goodbye')) {
        return "Best of luck in your career journey! I’m here if you need me!";
    } else if (message.includes('thanks') || message.includes('thank you')) {
        return "You’re welcome! Keep pushing toward your career goals!";
    } else {
        return "I’m here to help with your career. Could you clarify your question? Try asking about a job field, resume tips, or visit the Job Search page!";
    }
}

function planCareer() {
    const careerField = document.getElementById('career-field')?.value;
    const experienceLevel = document.getElementById('experience-level')?.value;
    const notes = document.getElementById('career-notes')?.value;

    if (!careerField || !experienceLevel) return;

    const careerGoal = { careerField, experienceLevel, notes };
    fetch('/api/career-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(careerGoal)
    })
    .then(response => response.json())
    .then(data => {
        careerGoals = data.careerGoals;
        localStorage.setItem('careerGoals', JSON.stringify(careerGoals));
        generateCareerPlan();
        document.getElementById('goals-form').reset();
        showSuccess('Career plan created!');
    })
    .catch(() => {
        showSuccess('Failed to save goal. Saved locally.');
        careerGoals.push(careerGoal);
        localStorage.setItem('careerGoals', JSON.stringify(careerGoals));
        generateCareerPlan();
        document.getElementById('goals-form').reset();
    });
}

function loadCareerGoals() {
    fetch('/api/career-goals')
        .then(response => response.json())
        .then(data => {
            careerGoals = data.careerGoals;
            localStorage.setItem('careerGoals', JSON.stringify(careerGoals));
            generateCareerPlan();
        })
        .catch(() => {
            const storedGoals = localStorage.getItem('careerGoals');
            if (storedGoals) {
                careerGoals = JSON.parse(storedGoals);
                generateCareerPlan();
            }
        });
}

function generateCareerPlan() {
    const goalsOutput = document.getElementById('goals-output');
    if (!goalsOutput) return;

    goalsOutput.innerHTML = careerGoals.length === 0 ? 'No career goals yet.' : '<h3>Your Career Plans</h3>' + careerGoals.map((g, i) => `
        <div class="career-item" data-index="${i}">
            <strong>${g.careerField}</strong><br>
            Experience Level: ${g.experienceLevel}<br>
            Notes: ${g.notes || 'None'}<br>
            Next Steps: Research opportunities, build skills (mock data).<br>
            <button class="delete-button" onclick="deleteGoal(${i})">Delete</button>
        </div>`).join('');
}

function deleteGoal(index) {
    fetch(`/api/career-goals/${index}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            careerGoals = data.careerGoals;
            localStorage.setItem('careerGoals', JSON.stringify(careerGoals));
            generateCareerPlan();
            showSuccess('Goal deleted!');
        })
        .catch(() => {
            careerGoals.splice(index, 1);
            localStorage.setItem('careerGoals', JSON.stringify(careerGoals));
            generateCareerPlan();
            showSuccess('Goal deleted locally!');
        });
}

function sendContactMessage() {
    const name = document.getElementById('contact-name')?.value;
    const email = document.getElementById('contact-email')?.value;
    const message = document.getElementById('contact-message')?.value;
    if (!name || !email || !message) return;

    console.log('Contact:', { name, email, message });
    showSuccess('Message sent!');
    document.getElementById('contact-form').reset();
}

function showSuccess(message) {
    const div = document.createElement('div');
    div.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #2b6cb0; color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 3000; font-size: 0.95rem;';
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}