
const url = 'https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin';

const basePayload = {
    "type": "cohorts",
    "selected": ["labs-aihack"],
    "dataset_name": "kloudkraft1",
    "random_questions": false,
    "number_of_questions": 5,
    "assessment_time": 20
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
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    // 1. Exact user payload (Control)
    await test('Control (Object)', basePayload);

    // 2. Wrapped in Array (Common issue with lambda pandas layers)
    await test('Array Wrapped', [basePayload]);

    // 3. With Username added
    const withUser = { ...basePayload, username: "admin_test" };
    await test('With Username', withUser);

    // 4. Snake case check
    const withDataset = { ...basePayload, dataset: "kloudkraft1" };
    delete withDataset.dataset_name;
    await test('With "dataset" key', withDataset);
}

run();
