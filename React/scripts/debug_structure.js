
const url = 'https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin';

const minimalPayload = {
    "username": "test_user",
    "dataset": "kloudkraft1",
    "random_questions": "true",
    "number_of_questions": "5",
    "assessment_time": "20"
};

async function test(name, body) {
    console.log(`\n--- Test: ${name} ---`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text.substring(0, 300)}...`);
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    // 1. Empty Object
    await test('Empty Object', {});

    // 2. Minimal Required (as Strings)
    await test('Minimal Required Strings', minimalPayload);

    // 3. List Wrapper
    await test('List Wrapper', [minimalPayload]);

    // 4. "records" wrapper
    await test('Records Wrapper', { records: [minimalPayload] });
}

run();
