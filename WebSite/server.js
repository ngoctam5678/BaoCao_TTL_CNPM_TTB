const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'views')));

const usersFile = path.join(__dirname, 'users.txt');
const productsFile = path.join(__dirname, 'product.txt');

// Function to read product prices from product.txt
function getProductPrices() {
    const data = fs.readFileSync(productsFile, 'utf8');
    const lines = data.split('\n');
    const prices = {};
    lines.forEach(line => {
        const [product, price] = line.split('=');
        if (product && price) {
            prices[product.trim()] = parseFloat(price.trim());
        }
    });
    return prices;
}

// Route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'trangchu.html'));
});

// Route for the login page
app.get('/dangnhap', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dangnhap.html'));
});

// Route for the registration page
app.get('/dangky', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dangky.html'));
});

// Route for the user information page
app.get('/thongtin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'thongtin.html'));
});

// Route for logout
app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect('/dangnhap');
});

app.post('/dangky', (req, res) => {
    const { username, password, name, phone, dob } = req.body;
    const user = { username, password, name, phone, dob, purchasedItems: [] };

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading users file.');
            return;
        }
        let users = data ? JSON.parse(data) : [];
        users.push(user);
        fs.writeFile(usersFile, JSON.stringify(users), 'utf8', (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error writing users file.');
                return;
            }
            res.redirect('/dangnhap');
        });
    });
});

app.post('/dangnhap', (req, res) => {
    const { username, password } = req.body;

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading users file.');
            return;
        }
        let users = JSON.parse(data || '[]');
        let user = users.find(u => u.username === username && u.password === password);

        if (user) {
            res.cookie('username', username);
            res.redirect('/');
        } else {
            res.redirect('/dangnhap');
        }
    });
});

app.post('/mua', (req, res) => {
    const product = req.body.product;
    const username = req.cookies.username;

    if (!username) {
        res.redirect('/dangnhap');
        return;
    }

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading users file.');
            return;
        }
        let users = JSON.parse(data || '[]');
        let user = users.find(u => u.username === username);

        if (user) {
            user.purchasedItems.push(product);
            fs.writeFile(usersFile, JSON.stringify(users), 'utf8', (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error writing users file.');
                    return;
                }
                res.redirect('/');
            });
        } else {
            res.redirect('/dangnhap');
        }
    });
});

app.get('/userinfo', (req, res) => {
    const username = req.cookies.username;

    if (!username) {
        res.status(401).json({ error: 'Bạn chưa đăng nhập.' });
        return;
    }

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading users file.');
            return;
        }
        let users = JSON.parse(data || '[]');
        let user = users.find(u => u.username === username);

        if (user) {
            const prices = getProductPrices();
            const totalAmount = user.purchasedItems.reduce((total, item) => {
                return total + (prices[item.trim()] || 0);
            }, 0);
            res.json({ ...user, totalAmount });
        } else {
            res.status(404).json({ error: 'Người dùng không tồn tại.' });
        }
    });
});

app.listen(3000, () => {
    console.log('Server is running on port localhost:3000');
});
