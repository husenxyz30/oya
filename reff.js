const axios = require('axios');
const readline = require('readline');
const randomUseragent = require('random-useragent');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let authToken = ''; 

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createEmail() {
    const domain = 'edny.net';
    const email = `user${Math.random().toString(36).substring(7)}@${domain}`;
    const password = "password123";
    const userAgent = randomUseragent.getRandom();

    await axios.post('https://api.mail.tm/accounts', { address: email, password: password }, {
        headers: {
            'User -Agent': userAgent,
            'Content-Type': 'application/json'
        }
    });
    const loginRes = await axios.post('https://api.mail.tm/token', { address: email, password: password }, {
        headers: {
            'User -Agent': userAgent,
            'Content-Type': 'application/json'
        }
    });
    authToken = loginRes.data.token;

    console.log(`✅ Email berhasil dibuat: ${email}`);
    return email;
}

async function getOTP(email) {
    console.log("⌛ Menunggu kode OTP...");
    const userAgent = randomUser agent.getRandom();
    for (let i = 0; i < 30; i++) {
        await delay(5000);
        const response = await axios.get('https://api.mail.tm/messages', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'User -Agent': userAgent
            }
        });
        const messages = response.data['hydra:member'];
        for (const msg of messages) {
            if (msg.to[0].address === email) {
                const mailDetail = await axios.get(`https://api.mail.tm/messages/${msg.id}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'User -Agent': userAgent
                    }
                });
                const otpMatch = mailDetail.data.text.match(/\b\d{6}\b/);
                if (otpMatch) return otpMatch[0];
            }
        }
    }
    return null;
}

async function registerOyaChat(email, referralCode) {
    const userAgent = randomUser agent.getRandom();
    
    // Menggunakan API untuk mendaftar
    const response = await axios.post(`https://oyachat.com/api/register`, {
        email: email,
        referral_code: referralCode
    }, {
        headers: {
            'User -Agent': userAgent,
            'Content-Type': 'application/json'
        }
    });

    if (response.data.success) {
        console.log(`📨 Mendaftar OyaChat dengan email: ${email}`);
        
        const otp = await getOTP(email);
        if (!otp) {
            console.log("⚠️ Gagal mendapatkan kode OTP");
            return;
        }

        console.log(`✅ Kode OTP: ${otp}`);

        // Kirim OTP untuk verifikasi
        await axios.post(`https://oyachat.com/api/verify`, {
            email: email,
            otp: otp
        }, {
            headers: {
                'User -Agent': userAgent,
                'Content-Type': 'application/json'
            }
        });

        console.log("🎉 Pendaftaran berhasil!");
    } else {
        console.log("⚠️ Pendaftaran gagal!");
    }
}

rl.question("Masukkan kode referral: ", (referralCode) => {
    rl.question("Masukkan jumlah akun yang ingin dibuat: ", async (count) => {
        count = parseInt(count);
        for (let i = 0; i < count; i++) {
            const email = await createEmail();
            await registerOyaChat(email, referralCode);
        }
        rl.close();
    });
});
