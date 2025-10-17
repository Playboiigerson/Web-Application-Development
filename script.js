 // API Configuration - UPDATED FOR BACKEND INTEGRATION
    const API_BASE_URL = 'http://localhost:5000/api';
    let authToken = localStorage.getItem('authToken');
    let currentUser = null;

    // DOM Elements
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const addReminderBtn = document.getElementById('addReminderBtn');
    const navLinks = document.querySelectorAll('.nav-link');
    const homeSection = document.getElementById('home-section');
    const aboutSection = document.getElementById('about-section');
    const contactSection = document.getElementById('contact-section');
    const privacySection = document.getElementById('privacy-section');
    const contactForm = document.getElementById('contactForm');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const forgotPassword = document.getElementById('forgotPassword');
    const privacyPolicyFooterLink = document.getElementById('privacyPolicyFooterLink');
    const privacyPolicyLink = document.getElementById('privacyPolicyLink');
    const privacyLink = document.getElementById('privacyLink');
    const backToHome = document.getElementById('backToHome');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logoutBtn = document.getElementById('logoutBtn');

    // Transaction Modal Elements
    const transactionModal = document.getElementById('transactionModal');
    const closeTransactionModal = document.getElementById('closeTransactionModal');
    const transactionForm = document.getElementById('transactionForm');
    const transactionModalTitle = document.getElementById('transactionModalTitle');
    const transactionSubmitBtn = document.getElementById('transactionSubmitBtn');
    const editingTransactionId = document.getElementById('editingTransactionId');
    const typeButtons = document.querySelectorAll('.type-btn');
    const transactionCategory = document.getElementById('transactionCategory');
    const transactionsList = document.getElementById('transactionsList');
    const viewAllTransactions = document.getElementById('viewAllTransactions');

    // Reminder Modal Elements
    const reminderModal = document.getElementById('reminderModal');
    const closeReminderModal = document.getElementById('closeReminderModal');
    const reminderForm = document.getElementById('reminderForm');
    const remindersList = document.getElementById('remindersList');

    // Budget Settings Elements
    const budgetSettingsBtn = document.getElementById('budgetSettingsBtn');
    const budgetSettingsModal = document.getElementById('budgetSettingsModal');
    const closeBudgetSettingsModal = document.getElementById('closeBudgetSettingsModal');
    const budgetSettingsForm = document.getElementById('budgetSettingsForm');

    // Notification Elements
    const notificationContainer = document.getElementById('notificationContainer');

    // Financial Stats Elements
    const incomeAmount = document.getElementById('incomeAmount');
    const expensesAmount = document.getElementById('expensesAmount');
    const savingsAmount = document.getElementById('savingsAmount');
    const balanceAmount = document.getElementById('balanceAmount');

    // Chart Elements
    const timeRangeSelect = document.getElementById('timeRange');

    // Validation Elements
    const firstNameValidation = document.getElementById('firstNameValidation');
    const lastNameValidation = document.getElementById('lastNameValidation');
    const regStudentIdValidation = document.getElementById('regStudentIdValidation');
    const emailValidation = document.getElementById('emailValidation');
    const phoneValidation = document.getElementById('phoneValidation');
    const confirmPasswordValidation = document.getElementById('confirmPasswordValidation');
    const termsValidation = document.getElementById('termsValidation');
    const studentIdValidation = document.getElementById('studentIdValidation');
    const passwordValidation = document.getElementById('passwordValidation');

    // Password Strength Elements
    const passwordStrength = document.getElementById('passwordStrength');
    const lengthReq = document.getElementById('lengthReq');
    const uppercaseReq = document.getElementById('uppercaseReq');
    const lowercaseReq = document.getElementById('lowercaseReq');
    const numberReq = document.getElementById('numberReq');

    // Transaction categories
    const incomeCategories = [
        { value: 'allowance', text: 'Allowance' },
        { value: 'nasfaf', text: 'NASFAF' },
        { value: 'bursary', text: 'Bursary' },
        { value: 'part-time', text: 'Part-time Job' },
        { value: 'other-income', text: 'Other Income' }
    ];

    const expenseCategories = [
        { value: 'rent', text: 'Rent' },
        { value: 'food', text: 'Food' },
        { value: 'transport', text: 'Transport' },
        { value: 'tuition', text: 'Tuition Fees' },
        { value: 'books', text: 'Books & Supplies' },
        { value: 'entertainment', text: 'Entertainment' },
        { value: 'utilities', text: 'Utilities' },
        { value: 'other-expense', text: 'Other Expense' }
    ];

    const savingsCategories = [
        { value: 'emergency', text: 'Emergency Fund' },
        { value: 'investment', text: 'Investment' },
        { value: 'goal', text: 'Savings Goal' },
        { value: 'retirement', text: 'Retirement' },
        { value: 'other-savings', text: 'Other Savings' }
    ];

    // Data stores (now managed by backend)
    let transactions = [];
    let paymentReminders = [];
    let budgetData = {
        rent_budget: 0,
        food_budget: 0,
        transport_budget: 0,
        tuition_budget: 0,
        savings_budget: 0,
        other_budget: 0
    };

    // Track user login state
    let isUserLoggedIn = false;

    // Chart instances
    let expenseChart = null;
    let budgetChart = null;

    // API Service Functions
    const apiService = {
        async request(endpoint, options = {}) {
            const url = `${API_BASE_URL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            if (authToken && !endpoint.includes('/auth/')) {
                config.headers.Authorization = `Bearer ${authToken}`;
            }

            if (options.body) {
                config.body = JSON.stringify(options.body);
            }

            try {
                const response = await fetch(url, config);
                
                // Handle non-JSON responses
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Invalid response format from server: ${response.status}`);
                }
                
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || `HTTP error! status: ${response.status}`);
                }

                return data;
            } catch (error) {
                console.error('API request failed:', error);
                throw error;
            }
        },

        // Auth endpoints
        async register(userData) {
            return this.request('/auth/register', {
                method: 'POST',
                body: userData
            });
        },

        async login(credentials) {
            return this.request('/auth/login', {
                method: 'POST',
                body: credentials
            });
        },

        async getCurrentUser() {
            return this.request('/auth/me');
        },

        // Transaction endpoints
        async getTransactions(limit = null) {
            const endpoint = limit ? `/transactions?limit=${limit}` : '/transactions';
            return this.request(endpoint);
        },

        async createTransaction(transactionData) {
            return this.request('/transactions', {
                method: 'POST',
                body: transactionData
            });
        },

        async updateTransaction(id, transactionData) {
            return this.request(`/transactions/${id}`, {
                method: 'PUT',
                body: transactionData
            });
        },

        async deleteTransaction(id) {
            return this.request(`/transactions/${id}`, {
                method: 'DELETE'
            });
        },

        async getFinancialStats() {
            return this.request('/transactions/stats');
        },

        // Analytics endpoints
        async getExpenseAnalytics(timeRange = 'this_month') {
            return this.request(`/analytics/expenses?timeRange=${timeRange}`);
        },

        async getBudgetVsActual() {
            return this.request('/analytics/budget-vs-actual');
        },

        // Reminder endpoints
        async getReminders() {
            return this.request('/reminders');
        },

        async createReminder(reminderData) {
            return this.request('/reminders', {
                method: 'POST',
                body: reminderData
            });
        },

        async updateReminder(id, reminderData) {
            return this.request(`/reminders/${id}`, {
                method: 'PUT',
                body: reminderData
            });
        },

        async deleteReminder(id) {
            return this.request(`/reminders/${id}`, {
                method: 'DELETE'
            });
        },

        async getUpcomingReminders() {
            return this.request('/reminders/upcoming');
        },

        // Budget endpoints
        async getBudget() {
            return this.request('/budget');
        },

        async updateBudget(budgetData) {
            return this.request('/budget', {
                method: 'PUT',
                body: budgetData
            });
        }
    };

    // Event Listeners
    loginBtn.addEventListener('click', showLoginSection);
    registerBtn.addEventListener('click', showRegisterSection);
    getStartedBtn.addEventListener('click', showLoginSection);
    showRegister.addEventListener('click', showRegisterSection);
    showLogin.addEventListener('click', showLoginSection);
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    addTransactionBtn.addEventListener('click', showTransactionModal);
    addReminderBtn.addEventListener('click', showReminderModal);
    closeTransactionModal.addEventListener('click', hideTransactionModal);
    closeReminderModal.addEventListener('click', hideReminderModal);
    transactionForm.addEventListener('submit', handleTransactionSubmit);
    reminderForm.addEventListener('submit', handleReminderSubmit);
    typeButtons.forEach(btn => btn.addEventListener('click', handleTypeChange));
    viewAllTransactions.addEventListener('click', viewAllTransactionsHandler);
    navLinks.forEach(link => link.addEventListener('click', handleNavigation));
    contactForm.addEventListener('submit', handleContactForm);
    forgotPassword.addEventListener('click', handleForgotPassword);
    privacyPolicyFooterLink.addEventListener('click', showPrivacyPolicy);
    privacyPolicyLink.addEventListener('click', showPrivacyPolicy);
    privacyLink.addEventListener('click', showPrivacyPolicy);
    backToHome.addEventListener('click', showHome);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    logoutBtn.addEventListener('click', handleLogout);
    budgetSettingsBtn.addEventListener('click', showBudgetSettingsModal);
    closeBudgetSettingsModal.addEventListener('click', hideBudgetSettingsModal);
    budgetSettingsForm.addEventListener('submit', handleBudgetSettingsSubmit);
    timeRangeSelect.addEventListener('change', updateExpenseAnalytics);

    // Close modals when clicking outside
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) {
            hideTransactionModal();
        }
    });

    reminderModal.addEventListener('click', (e) => {
        if (e.target === reminderModal) {
            hideReminderModal();
        }
    });

    budgetSettingsModal.addEventListener('click', (e) => {
        if (e.target === budgetSettingsModal) {
            hideBudgetSettingsModal();
        }
    });

    // Real-time validation for registration form
    document.getElementById('firstName').addEventListener('input', validateFirstName);
    document.getElementById('lastName').addEventListener('input', validateLastName);
    document.getElementById('regStudentId').addEventListener('input', validateStudentId);
    document.getElementById('email').addEventListener('input', validateEmail);
    document.getElementById('phone').addEventListener('input', validatePhone);
    document.getElementById('regPassword').addEventListener('input', validatePassword);
    document.getElementById('confirmPassword').addEventListener('input', validateConfirmPassword);
    document.getElementById('terms').addEventListener('change', validateTerms);

    // Real-time validation for login form
    document.getElementById('studentId').addEventListener('input', validateLoginStudentId);
    document.getElementById('password').addEventListener('input', validateLoginPassword);

    // Set today's date as default for transaction and reminder dates
    document.getElementById('transactionDate').valueAsDate = new Date();
    document.getElementById('reminderDate').valueAsDate = new Date();

    // Initialize the app
    initializeApp();

    // Background Slideshow - Fixed Implementation
    // The slideshow is now handled entirely by CSS animations

    // Navigation Handler
    function handleNavigation(e) {
        e.preventDefault();
        const targetPage = this.getAttribute('data-page');
        
        // Update active nav link
        navLinks.forEach(link => link.classList.remove('active'));
        this.classList.add('active');
        
        // Hide all sections
        homeSection.style.display = 'none';
        aboutSection.style.display = 'none';
        contactSection.style.display = 'none';
        loginSection.style.display = 'none';
        registerSection.style.display = 'none';
        dashboard.style.display = 'none';
        privacySection.style.display = 'none';
        
        // Show target section
        switch(targetPage) {
            case 'home':
                homeSection.style.display = 'block';
                break;
            case 'about':
                aboutSection.style.display = 'block';
                break;
            case 'contact':
                contactSection.style.display = 'block';
                break;
        }
        
        // Update UI for logged in user
        updateUIForLoggedInUser();
    }

    // Show Home
    function showHome(e) {
        e.preventDefault();
        // Hide all sections
        homeSection.style.display = 'none';
        aboutSection.style.display = 'none';
        contactSection.style.display = 'none';
        loginSection.style.display = 'none';
        registerSection.style.display = 'none';
        dashboard.style.display = 'none';
        privacySection.style.display = 'none';
        
        // Show home section
        homeSection.style.display = 'block';
        
        // Update nav links
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector('[data-page="home"]').classList.add('active');
        
        // Update UI for logged in user
        updateUIForLoggedInUser();
    }

    // Show Login Section
    function showLoginSection(e) {
        e.preventDefault();
        // Hide all sections
        homeSection.style.display = 'none';
        aboutSection.style.display = 'none';
        contactSection.style.display = 'none';
        registerSection.style.display = 'none';
        dashboard.style.display = 'none';
        privacySection.style.display = 'none';
        
        // Show login section
        loginSection.style.display = 'block';
        
        // Update nav links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Update UI for logged in user
        updateUIForLoggedInUser();
    }

    // Show Register Section
    function showRegisterSection(e) {
        e.preventDefault();
        // Hide all sections
        homeSection.style.display = 'none';
        aboutSection.style.display = 'none';
        contactSection.style.display = 'none';
        loginSection.style.display = 'none';
        dashboard.style.display = 'none';
        privacySection.style.display = 'none';
        
        // Show register section
        registerSection.style.display = 'block';
        
        // Update nav links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Update UI for logged in user
        updateUIForLoggedInUser();
    }

    // Show Privacy Policy
    function showPrivacyPolicy(e) {
        e.preventDefault();
        // Hide all sections
        homeSection.style.display = 'none';
        aboutSection.style.display = 'none';
        contactSection.style.display = 'none';
        loginSection.style.display = 'none';
        registerSection.style.display = 'none';
        dashboard.style.display = 'none';
        
        // Show privacy policy section
        privacySection.style.display = 'block';
        
        // Update nav links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Update UI for logged in user
        updateUIForLoggedInUser();
    }

    // Show Budget Settings Modal
    async function showBudgetSettingsModal() {
        try {
            const response = await apiService.getBudget();
            if (response.budget) {
                budgetData = response.budget;
            }
        } catch (error) {
            console.error('Error loading budget:', error);
        }
        
        // Populate form with current budget values
        document.getElementById('rentBudget').value = budgetData.rent_budget || 0;
        document.getElementById('foodBudget').value = budgetData.food_budget || 0;
        document.getElementById('transportBudget').value = budgetData.transport_budget || 0;
        document.getElementById('tuitionBudget').value = budgetData.tuition_budget || 0;
        document.getElementById('savingsBudget').value = budgetData.savings_budget || 0;
        document.getElementById('otherBudget').value = budgetData.other_budget || 0;
        
        budgetSettingsModal.style.display = 'block';
    }

    // Hide Budget Settings Modal
    function hideBudgetSettingsModal() {
        budgetSettingsModal.style.display = 'none';
    }

    // Handle Budget Settings Submission - FIXED VERSION
    async function handleBudgetSettingsSubmit(e) {
        e.preventDefault();
        
        // Update budget data
        const newBudgetData = {
            rent_budget: parseFloat(document.getElementById('rentBudget').value) || 0,
            food_budget: parseFloat(document.getElementById('foodBudget').value) || 0,
            transport_budget: parseFloat(document.getElementById('transportBudget').value) || 0,
            tuition_budget: parseFloat(document.getElementById('tuitionBudget').value) || 0,
            savings_budget: parseFloat(document.getElementById('savingsBudget').value) || 0,
            other_budget: parseFloat(document.getElementById('otherBudget').value) || 0
        };
        
        try {
            await apiService.updateBudget(newBudgetData);
            budgetData = newBudgetData;
            
            // Update charts with new budget data
            await updateBudgetVsActualChart();
            
            // Close modal and show success message
            hideBudgetSettingsModal();
            showNotification('Budget Updated', 'Your monthly budget has been updated successfully', 'success');
        } catch (error) {
            console.error('Error updating budget:', error);
            showNotification('Error', 'Failed to update budget settings: ' + error.message, 'danger');
        }
    }

    // Update UI for logged in user
    function updateUIForLoggedInUser() {
        if (isUserLoggedIn) {
            addTransactionBtn.classList.add('visible');
            darkModeToggle.style.display = 'block';
            logoutBtn.style.display = 'block';
            loginBtn.style.display = 'none';
            registerBtn.style.display = 'none';
        } else {
            addTransactionBtn.classList.remove('visible');
            darkModeToggle.style.display = 'none';
            logoutBtn.style.display = 'none';
            loginBtn.style.display = 'block';
            registerBtn.style.display = 'block';
        }
    }

    // Handle Logout
    function handleLogout() {
        // Clear user session
        isUserLoggedIn = false;
        currentUser = null;
        authToken = null;
        localStorage.removeItem('authToken');
        
        // Clear data
        transactions = [];
        paymentReminders = [];
        
        // Destroy charts
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }
        if (budgetChart) {
            budgetChart.destroy();
            budgetChart = null;
        }
        
        // Hide dashboard
        dashboard.style.display = 'none';
        
        // Show home page
        homeSection.style.display = 'block';
        
        // Update nav links
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector('[data-page="home"]').classList.add('active');
        
        // Update UI for logged out user
        updateUIForLoggedInUser();
        
        // Show success message
        showNotification('Logged Out', 'You have been successfully logged out.', 'info');
    }

    // Show Transaction Modal
    function showTransactionModal(transactionId = null) {
        transactionModal.style.display = 'block';
        
        if (transactionId) {
            // Editing existing transaction
            const transaction = transactions.find(t => t.id === transactionId);
            if (transaction) {
                transactionModalTitle.textContent = 'Edit Transaction';
                transactionSubmitBtn.textContent = 'Update Transaction';
                editingTransactionId.value = transactionId;
                
                // Set form values
                document.querySelector(`.type-btn[data-type="${transaction.type}"]`).click();
                document.getElementById('transactionTitle').value = transaction.title;
                document.getElementById('transactionAmount').value = transaction.amount;
                document.getElementById('transactionCategory').value = transaction.category;
                document.getElementById('transactionDate').value = transaction.transaction_date || transaction.date;
                document.getElementById('transactionDescription').value = transaction.description || '';
            }
        } else {
            // Adding new transaction
            transactionModalTitle.textContent = 'Add New Transaction';
            transactionSubmitBtn.textContent = 'Add Transaction';
            editingTransactionId.value = '';
            transactionForm.reset();
            document.getElementById('transactionDate').valueAsDate = new Date();
            typeButtons[0].click();
        }
        
        // Set default category based on current type
        updateCategoryOptions();
    }

    // Hide Transaction Modal
    function hideTransactionModal() {
        transactionModal.style.display = 'none';
        transactionForm.reset();
        // Reset to today's date
        document.getElementById('transactionDate').valueAsDate = new Date();
        // Reset to income type
        typeButtons[0].click();
    }

    // Show Reminder Modal
    function showReminderModal() {
        reminderModal.style.display = 'block';
    }

    // Hide Reminder Modal
    function hideReminderModal() {
        reminderModal.style.display = 'none';
        reminderForm.reset();
        // Reset to today's date
        document.getElementById('reminderDate').valueAsDate = new Date();
    }

    // Handle Transaction Type Change
    function handleTypeChange() {
        typeButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        updateCategoryOptions();
    }

    // Update Category Options Based on Type
    function updateCategoryOptions() {
        const currentType = document.querySelector('.type-btn.active').dataset.type;
        let categories = [];
        
        if (currentType === 'income') {
            categories = incomeCategories;
        } else if (currentType === 'expense') {
            categories = expenseCategories;
        } else if (currentType === 'savings') {
            categories = savingsCategories;
        }
        
        // Clear existing options
        transactionCategory.innerHTML = '<option value="">Select a category</option>';
        
        // Add new options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.text;
            transactionCategory.appendChild(option);
        });
    }

    // Handle Transaction Submission
    async function handleTransactionSubmit(e) {
        e.preventDefault();
        
        const type = document.querySelector('.type-btn.active').dataset.type;
        const title = document.getElementById('transactionTitle').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const category = document.getElementById('transactionCategory').value;
        const transaction_date = document.getElementById('transactionDate').value;
        const description = document.getElementById('transactionDescription').value;
        const transactionId = editingTransactionId.value;
        
        const transactionData = {
            type,
            title,
            amount,
            category,
            transaction_date,
            description
        };
        
        try {
            if (transactionId) {
                // Update existing transaction
                await apiService.updateTransaction(transactionId, transactionData);
                showNotification('Transaction Updated', `Successfully updated ${type}: ${title} - N$ ${amount}`, 'success');
            } else {
                // Create new transaction
                await apiService.createTransaction(transactionData);
                showNotification('Transaction Added', `Successfully added ${type}: ${title} - N$ ${amount}`, 'success');
            }
            
            // Refresh data and charts
            await loadDashboardData();
            
            // Close modal
            hideTransactionModal();
        } catch (error) {
            console.error('Error saving transaction:', error);
            showNotification('Error', 'Failed to save transaction', 'danger');
        }
    }

    // Handle Reminder Submission
    async function handleReminderSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('reminderTitle').value;
        const amount = parseFloat(document.getElementById('reminderAmount').value) || 0;
        const category = document.getElementById('reminderCategory').value;
        const due_date = document.getElementById('reminderDate').value;
        const notes = document.getElementById('reminderNotes').value;
        const is_recurring = document.getElementById('reminderRecurring').checked;
        
        const reminderData = {
            title,
            amount,
            category,
            due_date,
            notes,
            is_recurring
        };
        
        try {
            await apiService.createReminder(reminderData);
            
            // Refresh data
            await loadDashboardData();
            
            // Close modal and show success message
            hideReminderModal();
            showNotification('Reminder Added', `Payment reminder for "${title}" has been added`, 'success');
        } catch (error) {
            console.error('Error creating reminder:', error);
            showNotification('Error', 'Failed to create reminder', 'danger');
        }
    }

    // Update Financial Stats
    async function updateFinancialStats() {
        try {
            const response = await apiService.getFinancialStats();
            const stats = response.stats;
            
            // Update UI
            incomeAmount.textContent = `N$ ${(stats.income || 0).toLocaleString()}`;
            expensesAmount.textContent = `N$ ${(stats.expenses || 0).toLocaleString()}`;
            savingsAmount.textContent = `N$ ${(stats.savings || 0).toLocaleString()}`;
            balanceAmount.textContent = `N$ ${(stats.balance || 0).toLocaleString()}`;
        } catch (error) {
            console.error('Error loading financial stats:', error);
        }
    }

    // NEW: Update Expense Analytics Chart - FIXED VERSION
    async function updateExpenseAnalytics() {
        try {
            const timeRange = document.getElementById('timeRange').value;
            console.log('Fetching expense analytics for time range:', timeRange);
            
            const response = await apiService.getExpenseAnalytics(timeRange);
            console.log('Expense analytics response:', response);
            
            if (response && response.data && response.labels) {
                if (expenseChart) {
                    expenseChart.data.labels = response.labels;
                    expenseChart.data.datasets[0].data = response.data;
                    expenseChart.update();
                    console.log('Expense chart updated successfully');
                } else {
                    console.warn('Expense chart not initialized');
                }
            } else {
                console.warn('Invalid expense analytics data structure:', response);
                // Initialize with empty data if API returns invalid structure
                if (expenseChart) {
                    expenseChart.data.labels = ['Rent', 'Food', 'Transport', 'School Fees', 'Savings', 'Other'];
                    expenseChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
                    expenseChart.update();
                }
            }
        } catch (error) {
            console.error('Error updating expense analytics:', error);
            showNotification('Error', 'Failed to load expense analytics', 'danger');
            
            // Initialize with empty data on error
            if (expenseChart) {
                expenseChart.data.labels = ['Rent', 'Food', 'Transport', 'School Fees', 'Savings', 'Other'];
                expenseChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
                expenseChart.update();
            }
        }
    }

    // NEW: Update Budget vs Actual Chart - FIXED VERSION
    async function updateBudgetVsActualChart() {
        try {
            console.log('Fetching budget vs actual data...');
            const response = await apiService.getBudgetVsActual();
            console.log('Budget vs actual response:', response);
            
            if (response && response.planned && response.actual && response.labels) {
                if (budgetChart) {
                    budgetChart.data.labels = response.labels;
                    budgetChart.data.datasets[0].data = response.planned;
                    budgetChart.data.datasets[1].data = response.actual;
                    budgetChart.update();
                    console.log('Budget chart updated successfully');
                } else {
                    console.warn('Budget chart not initialized');
                }
            } else {
                console.warn('Invalid budget vs actual data structure:', response);
                // Initialize with empty data if API returns invalid structure
                if (budgetChart) {
                    budgetChart.data.labels = ['Rent', 'Food', 'Transport', 'School Fees', 'Savings', 'Other'];
                    budgetChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
                    budgetChart.data.datasets[1].data = [0, 0, 0, 0, 0, 0];
                    budgetChart.update();
                }
            }
        } catch (error) {
            console.error('Error updating budget vs actual chart:', error);
            showNotification('Error', 'Failed to load budget data', 'danger');
            
            // Initialize with empty data on error
            if (budgetChart) {
                budgetChart.data.labels = ['Rent', 'Food', 'Transport', 'School Fees', 'Savings', 'Other'];
                budgetChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0];
                budgetChart.data.datasets[1].data = [0, 0, 0, 0, 0, 0];
                budgetChart.update();
            }
        }
    }

    // Render Transactions
    async function renderTransactions() {
        try {
            const response = await apiService.getTransactions(5);
            transactions = response.transactions;
            
            // Clear existing transactions
            transactionsList.innerHTML = '';
            
            // Add transactions to list
            transactions.forEach(transaction => {
                const li = document.createElement('li');
                li.className = 'transaction-item';
                
                // Get icon and color based on category
                const { icon, color } = getTransactionIcon(transaction.category, transaction.type);
                
                li.innerHTML = `
                    <div class="transaction-info">
                        <div class="transaction-icon" style="background-color: ${color};">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4>${transaction.title}</h4>
                            <p>${formatDate(transaction.transaction_date || transaction.date)} • ${getCategoryName(transaction.category)}</p>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type === 'expense' ? 'expense' : transaction.type === 'savings' ? 'savings-trans' : 'income-trans'}">
                        ${transaction.type === 'expense' || transaction.type === 'savings' ? '-' : '+'} N$ ${transaction.amount.toLocaleString()}
                    </div>
                    <div class="transaction-actions">
                        <button class="transaction-action edit" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="transaction-action delete" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                transactionsList.appendChild(li);
            });
            
            // Show message if no transactions
            if (transactions.length === 0) {
                transactionsList.innerHTML = '<li style="text-align: center; padding: 20px; color: #666;">No transactions yet. Click the + button to add one.</li>';
            }
            
            // Add event listeners to action buttons
            document.querySelectorAll('.transaction-action.edit').forEach(button => {
                button.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    showTransactionModal(id);
                });
            });
            
            document.querySelectorAll('.transaction-action.delete').forEach(button => {
                button.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    deleteTransaction(id);
                });
            });
        } catch (error) {
            console.error('Error loading transactions:', error);
            // If unauthorized, prompt user to login
            const msg = (error && error.message) ? error.message : 'Failed to load transactions';
            if (/access token required|invalid|expired|401|403/i.test(msg)) {
                transactionsList.innerHTML = '<li style="text-align: center; padding: 20px; color: #666;">Please log in to view transactions.</li>';
                // Optionally clear stored token if it's invalid
                localStorage.removeItem('authToken');
                authToken = null;
                isUserLoggedIn = false;
                // Update UI to show login form
                loginSection.style.display = 'block';
                dashboard.style.display = 'none';
            } else {
                transactionsList.innerHTML = `<li style="text-align: center; padding: 20px; color: #666;">${msg}</li>`;
            }
        }
    }

    // Delete Transaction
    async function deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            try {
                await apiService.deleteTransaction(id);
                showNotification('Transaction Deleted', 'Transaction has been removed', 'info');
                await loadDashboardData();
            } catch (error) {
                console.error('Error deleting transaction:', error);
                showNotification('Error', 'Failed to delete transaction', 'danger');
            }
        }
    }

    // Render Reminders
    async function renderReminders() {
        try {
            const response = await apiService.getReminders();
            paymentReminders = response.reminders;
            
            // Clear existing reminders
            remindersList.innerHTML = '';
            
            // Sort reminders by due date (closest first)
            const sortedReminders = [...paymentReminders].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
            
            // Add reminders to list
            sortedReminders.forEach(reminder => {
                const li = document.createElement('li');
                li.className = 'reminder-item';
                
                // Determine reminder status
                const daysUntilDue = getDaysUntilDue(reminder.due_date);
                let statusClass = '';
                let statusText = '';
                
                if (daysUntilDue < 0) {
                    statusClass = 'danger';
                    statusText = 'Overdue';
                } else if (daysUntilDue === 0) {
                    statusClass = 'danger';
                    statusText = 'Due Today';
                } else if (daysUntilDue <= 3) {
                    statusClass = 'warning';
                    statusText = `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`;
                } else if (daysUntilDue <= 7) {
                    statusClass = 'info';
                    statusText = `Due in ${daysUntilDue} days`;
                } else {
                    statusText = `Due in ${daysUntilDue} days`;
                }
                
                li.innerHTML = `
                    <div class="reminder-icon">
                        <i class="fas fa-exclamation-circle ${statusClass ? `text-${statusClass}` : ''}"></i>
                    </div>
                    <div class="reminder-details">
                        <h4>${reminder.title}</h4>
                        <p>Due: ${formatDate(reminder.due_date)} ${reminder.amount > 0 ? `- N$ ${reminder.amount}` : ''}</p>
                        ${statusText ? `<small class="text-${statusClass}">${statusText}</small>` : ''}
                    </div>
                    <div class="reminder-actions">
                        <button class="reminder-action delete" data-id="${reminder.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                remindersList.appendChild(li);
            });
            
            // Show message if no reminders
            if (paymentReminders.length === 0) {
                remindersList.innerHTML = '<li style="text-align: center; padding: 20px; color: #666;">No payment reminders yet. Click "Add Reminder" to create one.</li>';
            }
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.reminder-action.delete').forEach(button => {
                button.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    deleteReminder(id);
                });
            });
        } catch (error) {
            console.error('Error loading reminders:', error);
            remindersList.innerHTML = '<li style="text-align: center; padding: 20px; color: #666;">Error loading reminders</li>';
        }
    }

    // Delete Reminder
    async function deleteReminder(id) {
        try {
            await apiService.deleteReminder(id);
            showNotification('Reminder Deleted', 'Payment reminder has been removed', 'info');
            await loadDashboardData();
        } catch (error) {
            console.error('Error deleting reminder:', error);
            showNotification('Error', 'Failed to delete reminder', 'danger');
        }
    }

    // Get Days Until Due
    function getDaysUntilDue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Check Reminder Due Soon
    function checkReminderDueSoon(reminder) {
        const daysUntilDue = getDaysUntilDue(reminder.due_date);
        
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
            let message = '';
            if (daysUntilDue === 0) {
                message = `"${reminder.title}" is due today!`;
            } else if (daysUntilDue === 1) {
                message = `"${reminder.title}" is due tomorrow!`;
            } else {
                message = `"${reminder.title}" is due in ${daysUntilDue} days`;
            }
            
            if (reminder.amount > 0) {
                message += ` - N$ ${reminder.amount}`;
            }
            
            showNotification('Payment Due Soon', message, 'warning');
        }
    }

    // Start Reminder Checker
    function startReminderChecker() {
        // Check for due reminders every minute
        setInterval(async () => {
            try {
                const response = await apiService.getUpcomingReminders();
                response.reminders.forEach(reminder => {
                    checkReminderDueSoon(reminder);
                });
            } catch (error) {
                console.error('Error checking reminders:', error);
            }
        }, 60000); // Check every minute
    }

    // Show Notification
    function showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        if (type === 'danger') icon = 'fa-exclamation-circle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Get Transaction Icon
    function getTransactionIcon(category, type) {
        const icons = {
            rent: { icon: 'fa-home', color: '#e74c3c' },
            food: { icon: 'fa-utensils', color: '#f39c12' },
            transport: { icon: 'fa-bus', color: '#3498db' },
            tuition: { icon: 'fa-graduation-cap', color: '#9b59b6' },
            books: { icon: 'fa-book', color: '#3498db' },
            entertainment: { icon: 'fa-film', color: '#e67e22' },
            utilities: { icon: 'fa-bolt', color: '#f1c40f' },
            allowance: { icon: 'fa-money-bill-wave', color: '#2ecc71' },
            nasfaf: { icon: 'fa-university', color: '#2ecc71' },
            bursary: { icon: 'fa-award', color: '#2ecc71' },
            'part-time': { icon: 'fa-briefcase', color: '#2ecc71' },
            emergency: { icon: 'fa-shield-alt', color: '#9b59b6' },
            investment: { icon: 'fa-chart-line', color: '#9b59b6' },
            goal: { icon: 'fa-bullseye', color: '#9b59b6' },
            retirement: { icon: 'fa-umbrella-beach', color: '#9b59b6' }
        };
        
        // Default icons
        const defaultIncome = { icon: 'fa-money-bill-wave', color: '#2ecc71' };
        const defaultExpense = { icon: 'fa-shopping-cart', color: '#e74c3c' };
        const defaultSavings = { icon: 'fa-piggy-bank', color: '#9b59b6' };
        
        return icons[category] || 
               (type === 'income' ? defaultIncome : 
                type === 'savings' ? defaultSavings : defaultExpense);
    }

    // Format Date
    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // View All Transactions
    async function viewAllTransactionsHandler() {
        try {
            const response = await apiService.getTransactions();
            const allTransactions = response.transactions;
            
            // Create a modal to display all transactions
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.style.display = 'block';
            modal.style.zIndex = '1002';
            
            modal.innerHTML = `
                <div class="modal" style="max-width: 800px; max-height: 80vh;">
                    <div class="modal-header">
                        <h3 class="modal-title">All Transactions</h3>
                        <button class="close-modal" id="closeAllTransactionsModal">&times;</button>
                    </div>
                    <div style="max-height: 60vh; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f8f9fa;">
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Date</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Type</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Category</th>
                                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
                                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="allTransactionsTableBody">
                                <!-- Transactions will be populated here -->
                            </tbody>
                        </table>
                        ${allTransactions.length === 0 ? '<p style="text-align: center; padding: 20px; color: #666;">No transactions found</p>' : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Populate the table with all transactions
            const tableBody = document.getElementById('allTransactionsTableBody');
            
            allTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #dee2e6';
                
                const { icon, color } = getTransactionIcon(transaction.category, transaction.type);
                
                row.innerHTML = `
                    <td style="padding: 12px;">${formatDate(transaction.transaction_date || transaction.date)}</td>
                    <td style="padding: 12px;">
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; text-transform: capitalize; 
                            background-color: ${transaction.type === 'income' ? 'rgba(46, 204, 113, 0.2)' : 
                                            transaction.type === 'savings' ? 'rgba(155, 89, 182, 0.2)' : 
                                            'rgba(231, 76, 60, 0.2)'}; 
                            color: ${transaction.type === 'income' ? '#2ecc71' : 
                                   transaction.type === 'savings' ? '#9b59b6' : 
                                   '#e74c3c'};">
                            ${transaction.type}
                        </span>
                    </td>
                    <td style="padding: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${color}; display: flex; align-items: center; justify-content: center;">
                                <i class="fas ${icon}" style="color: white; font-size: 12px;"></i>
                            </div>
                            ${transaction.title}
                        </div>
                    </td>
                    <td style="padding: 12px;">${getCategoryName(transaction.category)}</td>
                    <td style="padding: 12px; text-align: right; color: ${transaction.type === 'income' ? '#2ecc71' : 
                                                                        transaction.type === 'savings' ? '#9b59b6' : 
                                                                        '#e74c3c'}; font-weight: bold;">
                        ${transaction.type === 'income' ? '+' : '-'} N$ ${transaction.amount.toLocaleString()}
                    </td>
                    <td style="padding: 12px; text-align: center;">
                        <button class="transaction-action edit" data-id="${transaction.id}" style="background: none; border: none; cursor: pointer; color: #666; margin-right: 10px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="transaction-action delete" data-id="${transaction.id}" style="background: none; border: none; cursor: pointer; color: #666;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons in the modal
            modal.querySelectorAll('.transaction-action.edit').forEach(button => {
                button.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    document.body.removeChild(modal);
                    showTransactionModal(id);
                });
            });
            
            modal.querySelectorAll('.transaction-action.delete').forEach(button => {
                button.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    if (confirm('Are you sure you want to delete this transaction?')) {
                        deleteTransaction(id);
                        document.body.removeChild(modal);
                    }
                });
            });
            
            // Close modal functionality
            const closeBtn = document.getElementById('closeAllTransactionsModal');
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } catch (error) {
            console.error('Error loading all transactions:', error);
            showNotification('Error', 'Failed to load transactions', 'danger');
        }
    }

    // Get Category Name
    function getCategoryName(categoryValue) {
        const allCategories = [...incomeCategories, ...expenseCategories, ...savingsCategories];
        const category = allCategories.find(cat => cat.value === categoryValue);
        return category ? category.text : categoryValue;
    }

    // Toggle Dark Mode
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        
        if (isDarkMode) {
            icon.className = 'fas fa-sun';
            localStorage.setItem('darkMode', 'enabled');
        } else {
            icon.className = 'fas fa-moon';
            localStorage.setItem('darkMode', 'disabled');
        }
    }

    // Check for saved dark mode preference
    function checkDarkModePreference() {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'enabled') {
            document.body.classList.add('dark-mode');
            const icon = darkModeToggle.querySelector('i');
            icon.className = 'fas fa-sun';
        }
    }

    // Validation Functions
    function validateFirstName() {
        const firstName = document.getElementById('firstName').value;
        const isValid = /^[A-Za-z\s]{2,}$/.test(firstName);
        
        updateValidation(firstNameValidation, isValid, 'First name must contain only letters and be at least 2 characters');
        updateFieldStatus('firstName', isValid);
        
        return isValid;
    }

    function validateLastName() {
        const lastName = document.getElementById('lastName').value;
        const isValid = /^[A-Za-z\s]{2,}$/.test(lastName);
        
        updateValidation(lastNameValidation, isValid, 'Last name must contain only letters and be at least 2 characters');
        updateFieldStatus('lastName', isValid);
        
        return isValid;
    }

    function validateStudentId() {
        const studentId = document.getElementById('regStudentId').value;
        const isValid = /^\d{9}$/.test(studentId);
        
        updateValidation(regStudentIdValidation, isValid, 'Student ID must be exactly 9 digits (numbers only)');
        updateFieldStatus('regStudentId', isValid);
        
        return isValid;
    }

    function validateEmail() {
        const email = document.getElementById('email').value;
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        
        updateValidation(emailValidation, isValid, 'Please enter a valid email address');
        updateFieldStatus('email', isValid);
        
        return isValid;
    }

    function validatePhone() {
        const phone = document.getElementById('phone').value;
        const isValid = phone === '' || /^\d{10}$/.test(phone);
        
        updateValidation(phoneValidation, isValid, 'Phone number must be exactly 10 digits (numbers only)');
        updateFieldStatus('phone', isValid);
        
        return isValid;
    }

    function validatePassword() {
        const password = document.getElementById('regPassword').value;
        
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        updateRequirement(lengthReq, hasLength);
        updateRequirement(uppercaseReq, hasUppercase);
        updateRequirement(lowercaseReq, hasLowercase);
        updateRequirement(numberReq, hasNumber);
        
        let strength = 0;
        if (hasLength) strength++;
        if (hasUppercase) strength++;
        if (hasLowercase) strength++;
        if (hasNumber) strength++;
        
        passwordStrength.className = 'password-strength';
        if (strength > 0) {
            if (strength <= 2) {
                passwordStrength.classList.add('weak');
            } else if (strength === 3) {
                passwordStrength.classList.add('medium');
            } else {
                passwordStrength.classList.add('strong');
            }
        }
        
        const isValid = hasLength && hasUppercase && hasLowercase && hasNumber;
        updateFieldStatus('regPassword', isValid);
        
        return isValid;
    }

    function validateConfirmPassword() {
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const isValid = password === confirmPassword && password !== '';
        
        updateValidation(confirmPasswordValidation, isValid, 'Passwords do not match');
        updateFieldStatus('confirmPassword', isValid);
        
        return isValid;
    }

    function validateTerms() {
        const terms = document.getElementById('terms').checked;
        const isValid = terms;
        
        updateValidation(termsValidation, isValid, 'You must agree to the terms and conditions');
        
        return isValid;
    }

    function validateLoginStudentId() {
        const studentId = document.getElementById('studentId').value;
        const isValid = /^\d{9}$/.test(studentId);
        
        updateValidation(studentIdValidation, isValid, 'Student ID must be exactly 9 digits (numbers only)');
        updateFieldStatus('studentId', isValid);
        
        return isValid;
    }

    function validateLoginPassword() {
        const password = document.getElementById('password').value;
        const isValid = password.length > 0;
        
        updateValidation(passwordValidation, isValid, 'Please enter your password');
        updateFieldStatus('password', isValid);
        
        return isValid;
    }

    // Helper Functions
    function updateValidation(element, isValid, message) {
        if (isValid) {
            element.textContent = '✓ Valid';
            element.className = 'validation-message valid';
        } else {
            element.textContent = message;
            element.className = 'validation-message invalid';
        }
    }

    function updateFieldStatus(fieldId, isValid) {
        const field = document.getElementById(fieldId);
        if (isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
        }
    }

    function updateRequirement(element, isMet) {
        if (isMet) {
            element.classList.add('valid');
            element.classList.remove('invalid');
            element.querySelector('i').className = 'fas fa-check-circle';
        } else {
            element.classList.add('invalid');
            element.classList.remove('valid');
            element.querySelector('i').className = 'fas fa-circle';
        }
    }

    // Handle Login
    async function handleLogin(e) {
        e.preventDefault();
        
        const isStudentIdValid = validateLoginStudentId();
        const isPasswordValid = validateLoginPassword();
        
        if (!isStudentIdValid || !isPasswordValid) {
            showNotification('Validation Error', 'Please fix the validation errors before submitting', 'danger');
            return;
        }
        
        const studentId = document.getElementById('studentId').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await apiService.login({ studentId, password });
            
            authToken = response.token;
            localStorage.setItem('authToken', authToken);
            currentUser = response.user;
            
            loginSection.style.display = 'none';
            showDashboard();
            await loadDashboardData();
            
            // Update nav links
            navLinks.forEach(link => link.classList.remove('active'));
            document.querySelector('[data-page="home"]').classList.add('active');
            
            // Set user as logged in
            isUserLoggedIn = true;
            
            // Update UI for logged in user
            updateUIForLoggedInUser();
            
            // Show success message
            showNotification('Login Successful', 'Welcome back to your Budget Tracker!', 'success');
        } catch (error) {
            showNotification('Login Failed', error.message || 'Invalid student ID or password. Please try again.', 'danger');
        }
    }

    // Handle Register
    async function handleRegister(e) {
        e.preventDefault();
        
        const isFirstNameValid = validateFirstName();
        const isLastNameValid = validateLastName();
        const isStudentIdValid = validateStudentId();
        const isEmailValid = validateEmail();
        const isPhoneValid = validatePhone();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const isTermsValid = validateTerms();
        
        if (!isFirstNameValid || !isLastNameValid || !isStudentIdValid || 
            !isEmailValid || !isPhoneValid || !isPasswordValid || 
            !isConfirmPasswordValid || !isTermsValid) {
            showNotification('Registration Error', 'Please fix the validation errors before submitting', 'danger');
            return;
        }
        
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            studentId: document.getElementById('regStudentId').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('regPassword').value
        };

        try {
            const response = await apiService.register(userData);
            
            authToken = response.token;
            localStorage.setItem('authToken', authToken);
            currentUser = response.user;
            
            registerSection.style.display = 'none';
            showDashboard();
            await loadDashboardData();
            
            // Update user info in dashboard
            userAvatar.textContent = currentUser.avatar_initials;
            userName.textContent = `${currentUser.first_name} ${currentUser.last_name}`;
            
            // Update nav links
            navLinks.forEach(link => link.classList.remove('active'));
            document.querySelector('[data-page="home"]').classList.add('active');
            
            // Set user as logged in
            isUserLoggedIn = true;
            
            // Update UI for logged in user
            updateUIForLoggedInUser();
            
            // Show success message
            showNotification('Account Created', 'Welcome to Budget Tracker! Your account has been created successfully.', 'success');
        } catch (error) {
            showNotification('Registration Failed', error.message || 'Registration failed. Please try again.', 'danger');
        }
    }

    // Show Dashboard
    function showDashboard() {
        homeSection.style.display = 'none';
        aboutSection.style.display = 'none';
        contactSection.style.display = 'none';
        loginSection.style.display = 'none';
        registerSection.style.display = 'none';
        privacySection.style.display = 'none';
        dashboard.style.display = 'block';
        
        // Update user info
        if (currentUser) {
            userAvatar.textContent = currentUser.avatar_initials;
            userName.textContent = `${currentUser.first_name} ${currentUser.last_name}`;
        }
    }

    // Load Dashboard Data
    async function loadDashboardData() {
        try {
            await Promise.all([
                updateFinancialStats(),
                renderTransactions(),
                renderReminders()
            ]);
            
            // Initialize charts if they don't exist
            if (!expenseChart || !budgetChart) {
                initializeCharts();
            }
            
            // Load chart data
            await updateExpenseAnalytics();
            await updateBudgetVsActualChart();
            
            // Start reminder checker
            startReminderChecker();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showNotification('Error', 'Failed to load dashboard data', 'danger');
        }
    }

    // Handle Contact Form
    function handleContactForm(e) {
        e.preventDefault();
        showNotification('Message Sent', 'Thank you for your message! We will get back to you soon.', 'success');
        contactForm.reset();
    }

    // Handle Forgot Password
    function handleForgotPassword(e) {
        e.preventDefault();
        const email = prompt('Please enter your email address to reset your password:');
        if (email) {
            showNotification('Password Reset', `Password reset instructions have been sent to ${email}`, 'info');
        }
    }

    // Initialize Charts - FIXED VERSION
    function initializeCharts() {
        // Only initialize if canvas elements exist
        const expenseCanvas = document.getElementById('expenseChart');
        const budgetCanvas = document.getElementById('budgetChart');
        
        if (!expenseCanvas || !budgetCanvas) {
            console.warn('Chart canvas elements not found');
            return;
        }
        
        // Destroy existing charts if they exist
        if (expenseChart) {
            expenseChart.destroy();
        }
        if (budgetChart) {
            budgetChart.destroy();
        }
        
        // Expense Chart - Pie Chart for Expense Analytics
        const expenseCtx = expenseCanvas.getContext('2d');
        expenseChart = new Chart(expenseCtx, {
            type: 'pie',
            data: {
                labels: ['Rent', 'Food', 'Transport', 'School Fees', 'Savings', 'Other'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#e74c3c',
                        '#3498db',
                        '#2ecc71',
                        '#f39c12',
                        '#9b59b6',
                        '#34495e'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Expense Distribution'
                    }
                }
            }
        });

        // Budget Chart - Bar Chart for Budget vs Actual
        const budgetCtx = budgetCanvas.getContext('2d');
        budgetChart = new Chart(budgetCtx, {
            type: 'bar',
            data: {
                labels: ['Rent', 'Food', 'Transport', 'School Fees', 'Savings', 'Other'],
                datasets: [{
                    label: 'Planned Budget',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }, {
                    label: 'Actual Spending',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount (N$)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Budget vs Actual Spending'
                    }
                }
            }
        });
        
        console.log('Charts initialized successfully');
    }

    // Initialize App
    async function initializeApp() {
        // Check for dark mode preference
        checkDarkModePreference();
        
        // Check if user is already logged in
        if (authToken) {
            try {
                const response = await apiService.getCurrentUser();
                currentUser = response.user;
                isUserLoggedIn = true;
                showDashboard();
                await loadDashboardData();
                updateUIForLoggedInUser();
            } catch (error) {
                // Token is invalid, clear it
                localStorage.removeItem('authToken');
                authToken = null;
                showLoginSection(new Event('click'));
            }
        } else {
            showHome(new Event('click'));
        }
    }