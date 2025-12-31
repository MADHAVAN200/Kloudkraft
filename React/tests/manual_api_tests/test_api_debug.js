
const fetch = require('node-fetch'); // Revert to commonjs if needed, or stick to ESM if package.json allows. 
// Actually, previous run failed with require, so I will use the ESM compatible version I verified worked (native fetch in node 22).

const payload = {
    "type": "cohorts",
    "selected": ["labs-aihack"],
    "dataset_name": "kloudkraft1",
    "random_questions": false,
    "number_of_questions": 5,
    "assessment_time": 20
};

console.log('Testing with payload:', JSON.stringify(payload, null, 2));

try {
    const response = await fetch('https://x6uz5z6ju2.execute-api.us-west-2.amazonaws.com/SQLAdmin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    const text = await response.text();
    try {
        const data = JSON.parse(text);
        console.log('JSON Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('Raw Response:', text);
    }

} catch (err) {
    console.error('Error:', err);
}
