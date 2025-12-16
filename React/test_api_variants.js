
const originalPayload = {
    "type": "cohorts",
    "selected": ["labs-aihack"],
    "dataset_name": "kloudkraft1",
    "random_questions": false,
    "number_of_questions": 5,
    "assessment_time": 20
};

const url = 'https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin';

async function test(variantName, testUrl, testPayload) {
    console.log(`\nTesting ${variantName}...`);
    try {
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });
        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 200)}`); // Limit output
    } catch (err) {
        console.error('Error:', err);
    }
}

async function runTests() {
    // Test 1: Add query param ?type=create_assessment
    await test('Query Param: type=create_assessment', `${url}?type=create_assessment`, originalPayload);

    // Test 2: Add query param ?action=create_assessment
    await test('Query Param: action=create_assessment', `${url}?action=create_assessment`, originalPayload);

    // Test 3: Add action field to body
    const payloadWithAction = { ...originalPayload, action: 'create_assessment' };
    await test('Body Field: action=create_assessment', url, payloadWithAction);
}

runTests();
