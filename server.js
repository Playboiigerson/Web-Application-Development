const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'budget_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'budget-tracker-secret-key-2025';

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        
        // Check if tables exist
        await checkAndCreateTables();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('Please make sure:');
        console.log('1. MySQL server is running');
        console.log('2. Database "budget_tracker" exists');
        console.log('3. MySQL credentials in .env file are correct');
    }
}

// Check and create tables if they don't exist
async function checkAndCreateTables() {
    try {
        // Check users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(20) UNIQUE NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                avatar_initials VARCHAR(5),
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Check transactions table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('income', 'expense', 'savings') NOT NULL,
                title VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                category VARCHAR(50) NOT NULL,
                transaction_date DATE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Check payment_reminders table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS payment_reminders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) DEFAULT 0,
                category VARCHAR(50) NOT NULL,
                due_date DATE NOT NULL,
                notes TEXT,
                is_recurring BOOLEAN DEFAULT FALSE,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Check budget_settings table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS budget_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                rent_budget DECIMAL(10, 2) DEFAULT 0,
                food_budget DECIMAL(10, 2) DEFAULT 0,
                transport_budget DECIMAL(10, 2) DEFAULT 0,
                tuition_budget DECIMAL(10, 2) DEFAULT 0,
                savings_budget DECIMAL(10, 2) DEFAULT 0,
                other_budget DECIMAL(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user (user_id)
            )
        `);

        console.log('✅ All tables checked/created successfully');
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    }
}

// Enhanced utility function to execute queries with better error handling
async function executeQuery(query, params = []) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Process parameters to ensure correct types
        const processedParams = params.map(param => {
            if (typeof param === 'string' && !isNaN(param) && param.trim() !== '') {
                const num = Number(param);
                return isNaN(num) ? param : num;
            }
            return param;
        });

        console.log('Executing query:', query);
        console.log('Processed params:', processedParams);
        
        const [results] = await connection.execute(query, processedParams);
        return results;
    } catch (error) {
        console.error('Database error details:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('SQL state:', error.sqlState);
        console.error('Query:', query);
        console.error('Original params:', params);
        
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const users = await executeQuery('SELECT id, student_id, first_name, last_name, email, phone, avatar_initials FROM users WHERE id = ?', [decoded.userId]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Generate avatar initials
function generateAvatarInitials(firstName, lastName) {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

// Helper function to map database categories to display names
function getExpenseCategoryName(category) {
    const categoryMap = {
        'rent': 'Rent',
        'food': 'Food',
        'transport': 'Transport',
        'tuition': 'School Fees',
        'books': 'Other',
        'entertainment': 'Other',
        'utilities': 'Other',
        'other-expense': 'Other',
        'emergency': 'Savings',
        'investment': 'Savings',
        'goal': 'Savings',
        'retirement': 'Savings',
        'other-savings': 'Savings'
    };
    return categoryMap[category] || 'Other';
}

// AUTH ROUTES

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, studentId, email, phone, password } = req.body;

        // Check if user already exists
        const existingUser = await executeQuery(
            'SELECT id FROM users WHERE student_id = ? OR email = ?',
            [studentId, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Student ID or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const avatarInitials = generateAvatarInitials(firstName, lastName);

        // Insert user
        const result = await executeQuery(
            'INSERT INTO users (student_id, first_name, last_name, email, phone, password_hash, avatar_initials) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [studentId, firstName, lastName, email, phone, passwordHash, avatarInitials]
        );

        // Create default budget settings
        await executeQuery(
            'INSERT INTO budget_settings (user_id) VALUES (?)',
            [result.insertId]
        );

        // Generate token
        const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                student_id: studentId,
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                avatar_initials: avatarInitials
            }
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { studentId, password } = req.body;

        // Find user
        const users = await executeQuery(
            'SELECT id, student_id, first_name, last_name, email, phone, password_hash, avatar_initials FROM users WHERE student_id = ?',
            [studentId]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid student ID or password' });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid student ID or password' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                student_id: user.student_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                avatar_initials: user.avatar_initials
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    res.json({ user: req.user });
});

// TRANSACTION ROUTES

// Get all transactions with optional limit
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const limit = req.query.limit;
        const userId = req.user.id;

        let query = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, created_at DESC';
        const params = [userId];

        if (limit !== undefined && limit !== null) {
            const limitValue = parseInt(limit, 10);
            if (!isNaN(limitValue) && limitValue > 0) {
                query += ' LIMIT ' + limitValue;
            }
        }

        const transactions = await executeQuery(query, params);
        res.json({ transactions });
    } catch (error) {
        console.error('Get transactions error:', error.message);
        res.status(500).json({ error: 'Failed to load transactions: ' + error.message });
    }
});

// Create transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { type, title, amount, category, transaction_date, description } = req.body;

        const result = await executeQuery(
            'INSERT INTO transactions (user_id, type, title, amount, category, transaction_date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, type, title, amount, category, transaction_date, description]
        );

        const transactions = await executeQuery('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
        res.status(201).json({ transaction: transactions[0] });
    } catch (error) {
        console.error('Create transaction error:', error.message);
        res.status(500).json({ error: 'Failed to create transaction: ' + error.message });
    }
});

// Update transaction
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const { type, title, amount, category, transaction_date, description } = req.body;
        const transactionId = req.params.id;

        // Verify ownership
        const userTransactions = await executeQuery(
            'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
            [transactionId, req.user.id]
        );

        if (userTransactions.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await executeQuery(
            'UPDATE transactions SET type = ?, title = ?, amount = ?, category = ?, transaction_date = ?, description = ? WHERE id = ?',
            [type, title, amount, category, transaction_date, description, transactionId]
        );

        const transactions = await executeQuery('SELECT * FROM transactions WHERE id = ?', [transactionId]);
        res.json({ transaction: transactions[0] });
    } catch (error) {
        console.error('Update transaction error:', error.message);
        res.status(500).json({ error: 'Failed to update transaction: ' + error.message });
    }
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const transactionId = req.params.id;

        // Verify ownership
        const userTransactions = await executeQuery(
            'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
            [transactionId, req.user.id]
        );

        if (userTransactions.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await executeQuery('DELETE FROM transactions WHERE id = ?', [transactionId]);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error.message);
        res.status(500).json({ error: 'Failed to delete transaction: ' + error.message });
    }
});

// Get financial stats
app.get('/api/transactions/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await executeQuery(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
                COALESCE(SUM(CASE WHEN type = 'savings' THEN amount ELSE 0 END), 0) as savings,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
                COALESCE(SUM(CASE WHEN type IN ('expense', 'savings') THEN amount ELSE 0 END), 0) as balance
            FROM transactions 
            WHERE user_id = ? AND MONTH(transaction_date) = MONTH(CURRENT_DATE) AND YEAR(transaction_date) = YEAR(CURRENT_DATE)
        `, [req.user.id]);

        res.json({ stats: stats[0] });
    } catch (error) {
        console.error('Get stats error:', error.message);
        res.status(500).json({ error: 'Failed to load statistics: ' + error.message });
    }
});

// ANALYTICS ROUTES

// Get expense analytics data for charts
app.get('/api/analytics/expenses', authenticateToken, async (req, res) => {
    try {
        const { timeRange = 'this_month' } = req.query;
        
        let dateCondition = '';
        switch (timeRange) {
            case 'last_month':
                dateCondition = 'AND transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH) AND transaction_date < CURRENT_DATE';
                break;
            case 'this_semester':
                dateCondition = 'AND transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)';
                break;
            default: // this_month
                dateCondition = 'AND MONTH(transaction_date) = MONTH(CURRENT_DATE) AND YEAR(transaction_date) = YEAR(CURRENT_DATE)';
        }

        const expenseData = await executeQuery(`
            SELECT 
                category,
                SUM(amount) as total_amount
            FROM transactions 
            WHERE user_id = ? 
            AND type = 'expense'
            ${dateCondition}
            GROUP BY category
            ORDER BY total_amount DESC
        `, [req.user.id]);

        // Format data for chart
        const categories = {
            'Rent': 0,
            'Food': 0,
            'Transport': 0,
            'School Fees': 0,
            'Savings': 0,
            'Other': 0
        };

        expenseData.forEach(item => {
            const categoryName = getExpenseCategoryName(item.category);
            categories[categoryName] = item.total_amount;
        });

        res.json({ 
            data: Object.values(categories),
            labels: Object.keys(categories)
        });
    } catch (error) {
        console.error('Get expense analytics error:', error.message);
        res.status(500).json({ error: 'Failed to load expense analytics: ' + error.message });
    }
});

// Get budget vs actual data
app.get('/api/analytics/budget-vs-actual', authenticateToken, async (req, res) => {
    try {
        // Get budget data
        const budgetData = await executeQuery(
            'SELECT * FROM budget_settings WHERE user_id = ?',
            [req.user.id]
        );

        const budget = budgetData.length > 0 ? budgetData[0] : {
            rent_budget: 0,
            food_budget: 0,
            transport_budget: 0,
            tuition_budget: 0,
            savings_budget: 0,
            other_budget: 0
        };

        // Get actual spending data for current month
        const actualData = await executeQuery(`
            SELECT 
                category,
                SUM(amount) as total_amount
            FROM transactions 
            WHERE user_id = ? 
            AND (type = 'expense' OR type = 'savings')
            AND MONTH(transaction_date) = MONTH(CURRENT_DATE) 
            AND YEAR(transaction_date) = YEAR(CURRENT_DATE)
            GROUP BY category
        `, [req.user.id]);

        // Map actual spending to categories
        const actualSpending = {
            'Rent': 0,
            'Food': 0,
            'Transport': 0,
            'School Fees': 0,
            'Savings': 0,
            'Other': 0
        };

        actualData.forEach(item => {
            const categoryName = getExpenseCategoryName(item.category);
            actualSpending[categoryName] = item.total_amount;
        });

        const planned = [
            budget.rent_budget || 0,
            budget.food_budget || 0,
            budget.transport_budget || 0,
            budget.tuition_budget || 0,
            budget.savings_budget || 0,
            budget.other_budget || 0
        ];

        const actual = [
            actualSpending['Rent'],
            actualSpending['Food'],
            actualSpending['Transport'],
            actualSpending['School Fees'],
            actualSpending['Savings'],
            actualSpending['Other']
        ];

        res.json({
            planned,
            actual,
            labels: ['Rent', 'Food', 'Transport', 'School Fees', 'Savings', 'Other']
        });
    } catch (error) {
        console.error('Get budget vs actual error:', error.message);
        res.status(500).json({ error: 'Failed to load budget vs actual data: ' + error.message });
    }
});

// Get financial overview data
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
    try {
        const overview = await executeQuery(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
                COALESCE(SUM(CASE WHEN type = 'savings' THEN amount ELSE 0 END), 0) as total_savings,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
                COALESCE(SUM(CASE WHEN type IN ('expense', 'savings') THEN amount ELSE 0 END), 0) as balance
            FROM transactions 
            WHERE user_id = ? 
            AND MONTH(transaction_date) = MONTH(CURRENT_DATE) 
            AND YEAR(transaction_date) = YEAR(CURRENT_DATE)
        `, [req.user.id]);

        res.json({ overview: overview[0] });
    } catch (error) {
        console.error('Get overview error:', error.message);
        res.status(500).json({ error: 'Failed to load overview data: ' + error.message });
    }
});

// REMINDER ROUTES

// Get all reminders
app.get('/api/reminders', authenticateToken, async (req, res) => {
    try {
        const reminders = await executeQuery(
            'SELECT * FROM payment_reminders WHERE user_id = ? AND is_completed = FALSE ORDER BY due_date ASC',
            [req.user.id]
        );
        res.json({ reminders });
    } catch (error) {
        console.error('Get reminders error:', error.message);
        res.status(500).json({ error: 'Failed to load reminders: ' + error.message });
    }
});

// Get upcoming reminders (due in next 7 days)
app.get('/api/reminders/upcoming', authenticateToken, async (req, res) => {
    try {
        const reminders = await executeQuery(
            'SELECT * FROM payment_reminders WHERE user_id = ? AND is_completed = FALSE AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) ORDER BY due_date ASC',
            [req.user.id]
        );
        res.json({ reminders });
    } catch (error) {
        console.error('Get upcoming reminders error:', error.message);
        res.status(500).json({ error: 'Failed to load upcoming reminders: ' + error.message });
    }
});

// Create reminder
app.post('/api/reminders', authenticateToken, async (req, res) => {
    try {
        const { title, amount, category, due_date, notes, is_recurring } = req.body;

        const result = await executeQuery(
            'INSERT INTO payment_reminders (user_id, title, amount, category, due_date, notes, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, title, amount || 0, category, due_date, notes, is_recurring || false]
        );

        const reminders = await executeQuery('SELECT * FROM payment_reminders WHERE id = ?', [result.insertId]);
        res.status(201).json({ reminder: reminders[0] });
    } catch (error) {
        console.error('Create reminder error:', error.message);
        res.status(500).json({ error: 'Failed to create reminder: ' + error.message });
    }
});

// Update reminder
app.put('/api/reminders/:id', authenticateToken, async (req, res) => {
    try {
        const { title, amount, category, due_date, notes, is_recurring, is_completed } = req.body;
        const reminderId = req.params.id;

        // Verify ownership
        const userReminders = await executeQuery(
            'SELECT id FROM payment_reminders WHERE id = ? AND user_id = ?',
            [reminderId, req.user.id]
        );

        if (userReminders.length === 0) {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        await executeQuery(
            'UPDATE payment_reminders SET title = ?, amount = ?, category = ?, due_date = ?, notes = ?, is_recurring = ?, is_completed = ? WHERE id = ?',
            [title, amount || 0, category, due_date, notes, is_recurring || false, is_completed || false, reminderId]
        );

        const reminders = await executeQuery('SELECT * FROM payment_reminders WHERE id = ?', [reminderId]);
        res.json({ reminder: reminders[0] });
    } catch (error) {
        console.error('Update reminder error:', error.message);
        res.status(500).json({ error: 'Failed to update reminder: ' + error.message });
    }
});

// Delete reminder
app.delete('/api/reminders/:id', authenticateToken, async (req, res) => {
    try {
        const reminderId = req.params.id;

        // Verify ownership
        const userReminders = await executeQuery(
            'SELECT id FROM payment_reminders WHERE id = ? AND user_id = ?',
            [reminderId, req.user.id]
        );

        if (userReminders.length === 0) {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        await executeQuery('DELETE FROM payment_reminders WHERE id = ?', [reminderId]);
        res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        console.error('Delete reminder error:', error.message);
        res.status(500).json({ error: 'Failed to delete reminder: ' + error.message });
    }
});

// BUDGET ROUTES

// Get budget settings
app.get('/api/budget', authenticateToken, async (req, res) => {
    try {
        const budget = await executeQuery(
            'SELECT * FROM budget_settings WHERE user_id = ?',
            [req.user.id]
        );

        if (budget.length === 0) {
            // Create default budget settings if not exists
            const result = await executeQuery(
                'INSERT INTO budget_settings (user_id) VALUES (?)',
                [req.user.id]
            );
            const newBudget = await executeQuery('SELECT * FROM budget_settings WHERE id = ?', [result.insertId]);
            res.json({ budget: newBudget[0] });
        } else {
            res.json({ budget: budget[0] });
        }
    } catch (error) {
        console.error('Get budget error:', error.message);
        res.status(500).json({ error: 'Failed to load budget: ' + error.message });
    }
});

// Update budget settings - FIXED VERSION
app.put('/api/budget', authenticateToken, async (req, res) => {
    try {
        const { rent_budget, food_budget, transport_budget, tuition_budget, savings_budget, other_budget } = req.body;

        console.log('Updating budget with data:', req.body);

        // Check if budget exists
        const existingBudget = await executeQuery(
            'SELECT id FROM budget_settings WHERE user_id = ?',
            [req.user.id]
        );

        if (existingBudget.length === 0) {
            // Create new budget
            const result = await executeQuery(
                'INSERT INTO budget_settings (user_id, rent_budget, food_budget, transport_budget, tuition_budget, savings_budget, other_budget) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    req.user.id, 
                    rent_budget || 0, 
                    food_budget || 0, 
                    transport_budget || 0, 
                    tuition_budget || 0, 
                    savings_budget || 0, 
                    other_budget || 0
                ]
            );
            const newBudget = await executeQuery('SELECT * FROM budget_settings WHERE id = ?', [result.insertId]);
            res.json({ budget: newBudget[0] });
        } else {
            // Update existing budget
            await executeQuery(
                'UPDATE budget_settings SET rent_budget = ?, food_budget = ?, transport_budget = ?, tuition_budget = ?, savings_budget = ?, other_budget = ? WHERE user_id = ?',
                [
                    rent_budget || 0, 
                    food_budget || 0, 
                    transport_budget || 0, 
                    tuition_budget || 0, 
                    savings_budget || 0, 
                    other_budget || 0, 
                    req.user.id
                ]
            );
            const updatedBudget = await executeQuery('SELECT * FROM budget_settings WHERE user_id = ?', [req.user.id]);
            res.json({ budget: updatedBudget[0] });
        }
    } catch (error) {
        console.error('Update budget error:', error.message);
        res.status(500).json({ error: 'Failed to update budget: ' + error.message });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await executeQuery('SELECT 1');
        res.json({ 
            status: 'OK', 
            message: 'Budget Tracker API is running',
            database: 'Connected'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            message: 'API is running but database connection failed',
            database: 'Disconnected',
            error: error.message
        });
    }
});

// Initialize database endpoint
app.post('/api/init-db', async (req, res) => {
    try {
        await checkAndCreateTables();
        res.json({ message: 'Database initialized successfully' });
    } catch (error) {
        console.error('Database initialization error:', error.message);
        res.status(500).json({ error: 'Database initialization failed: ' + error.message });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API available at: http://localhost:${PORT}/api`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Database init: http://localhost:${PORT}/api/init-db (POST)`);
    
    // Test database connection on startup
    await testConnection();
});