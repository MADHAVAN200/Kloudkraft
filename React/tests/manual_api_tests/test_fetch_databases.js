
const url = 'https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin';

async function test(name, options) {
    console.log(`\n--- Testing ${name} ---`);
    try {
        const response = await fetch(options.url || url, options);
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 500)}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function run() {
    await test('GET type=available_datasets', { url: `${url}?type=available_datasets` });
    await test('GET type=available_databases', { url: `${url}?type=available_databases` });
    await test('GET type=list-databases', { url: `${url}?type=list-databases` });
    await test('GET type=get-databases', { url: `${url}?type=get-databases` });
    await test('GET type=all', { url: `${url}?type=all` });
    await test('GET type=schemas', { url: `${url}?type=schemas` });
}

run();
