async function testHealth() {
    const url = 'https://eventfold.vercel.app/api/health';
    console.log(`Checking ${url}...`);
    try {
        const res = await fetch(url);
        const contentType = res.headers.get('content-type');
        console.log(`Status: ${res.status}`);
        console.log(`Content-Type: ${contentType}`);

        const text = await res.text();
        if (contentType && contentType.includes('application/json')) {
            try {
                const json = JSON.parse(text);
                console.log('Response is valid JSON:', JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('Failed to parse JSON even though Content-Type says so.');
                console.log('Body snippet:', text.substring(0, 200));
            }
        } else {
            console.log('Response is NOT JSON.');
            console.log('Body snippet:', text.substring(0, 500));
            if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html')) {
                console.log('Response looks like an HTML file (likely index.html due to SPA routing).');
            }
        }
    } catch (err) {
        console.error('Error fetching health endpoint:', err.message, err.stack);
    }
}

testHealth();
