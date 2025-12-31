
const url = 'https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin';

const compliancePayload = {
    // Gatekeeper
    "type": "cohorts",
    "selected": ["labs-aihack"],

    // Missing Columns (Exactly as requested + variants)
    "username": "dummy_user",
    "dataset": "kloudkraft1",
    "dataset_name": "kloudkraft1",
    "random_question": "true",
    "random_questions": "true",
    "number_of_questions": "5",
    "assessment_time": "20",
    "assesment_time": "20"
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
        console.log(`Response: ${text.substring(0, 500)}`);
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    // 1. Full Compliance Object
    await test('Full Compliance Object', compliancePayload);

    // 2. Full Compliance List
    await test('Full Compliance List', [compliancePayload]);
}

run();
