async function runTests() {
  const tests = [
    { name: 'Health', url: 'http://localhost:4000/health', method: 'GET' },
    { name: 'Login Validation', url: 'http://localhost:4000/api/auth/login', method: 'POST', body: { email: 'bad@email', password: '' } },
    { name: 'Login Invalid Credentials', url: 'http://localhost:4000/api/auth/login', method: 'POST', body: { email: 'test@test.com', password: 'Password1' } },
    { name: 'Me (Unauthorized)', url: 'http://localhost:4000/api/auth/me', method: 'GET' },
    { name: 'Employees Stub', url: 'http://localhost:4000/api/employees', method: 'GET' },
    { name: 'Not Found', url: 'http://localhost:4000/api/nonexistent', method: 'GET' }
  ];

  for (const t of tests) {
    try {
      const res = await fetch(t.url, {
        method: t.method,
        headers: { 'Content-Type': 'application/json' },
        body: t.body ? JSON.stringify(t.body) : undefined
      });
      const data = await res.json();
      console.log(`--- ${t.name} ---`);
      console.log(`Status: ${res.status}`);
      console.log(`Body: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error(`Error in ${t.name}:`, err.message);
    }
  }
}

runTests();
