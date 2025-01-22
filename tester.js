const axios = require('axios');

// Generate random IP address in the range 192.168.1.1 to 192.168.1.254
const generateRandomIP = () => {
  const randomLastOctet = Math.floor(Math.random() * 254) + 1;
  return `192.168.1.${randomLastOctet}`;
};

// Send token request and handle the response
const generateTokenRequest = async (userId, audience, role, ipAddress, report) => {
  try {
    const response = await axios.post('http://localhost:3001/generate-token', {
      userId,
      audience,
      role,
      ipAddress,
    });
    console.log(`Request for IP ${ipAddress} sent successfully.`);
    console.log('Response:', response.data);

    // Track successful request in the report
    report.successfulRequests.push(ipAddress);
  } catch (error) {
    console.error(`Error for IP ${ipAddress}:`, error.response ? error.response.data : error.message);

    // Track error requests in the report
    report.errors.push({ ipAddress, error: error.response ? error.response.data : error.message });
  }
};

// Generate batch requests and keep track of success/error counts
const sendBatchRequests = async () => {
const userIds = [
    'b58f7b97-a4f6-4633-b3e6-4007c7cc1b2f',
    '3c7f80e6-0af5-4c54-b707-6fdfa5e24199',
    'ef3c94b4-d923-451f-aa1e-cde60cea7981',
    '8810e519-3964-49d4-aa70-0ae1666a663b',
    'ab38c05b-a39d-40e2-989d-e71dc1b35900',
    '941d276c-4533-4c49-8f29-8ecb1e5ed6a4',
    '8081b7db-538e-4540-9a8d-33a587534610',
    '6feaa54b-f592-4412-847c-4e0d988a291b',
    '372d4339-6f8b-4e2c-b3cc-43b9a6affa94',
    '00cd42fa-8e80-48da-8d7e-de639a5fac83',
    '4ed0a4f8-41b4-4252-8b0f-58b652a88d5a',
    'c5f63771-792c-485d-92dc-61e4030b7621',
    '347ed4e8-ec7e-4513-ba8b-3cf90fd0f667',
    'f8f1a1f7-785a-4fa2-b1a3-1f7805c822e9',
    'a375fe8f-fa7b-450e-acf1-059b6a7c83dd',
    '9a2963fb-569c-43cf-a3ce-ea5fa31bf211',
    '2889b936-2b58-4846-aaa8-0842af5e502a',
    '94db1e12-a132-4da3-8b45-c49f0e978f18',
    'aebc6d8d-4173-4a6c-9827-28756ac997cc',
    'c62f6f8b-6503-43c2-91ed-9d38d8912da9',
    'c02ba0df-c44a-4428-9af4-042cb2e62ac1',
    '53a498f1-7348-4820-9551-b47d62128e6c',
    'b4913bca-85bb-47fc-bc42-d72c4f40e141',
    'e9cc2a09-ee73-404a-aaf6-0cd9ddbc0630',
    'cbe842b0-f565-4a0a-b092-4ef1d2fd8fec',
    '7f0d3ee1-6128-4f04-a9e2-77b27856bbde',
    '2e04d1a3-ee21-4225-bb00-1c2b206676da',
    '62a9caef-db5b-4244-b124-31b6e35d630a',
    'b66d02e1-ac14-464a-8b39-a61de7fb5591',
    '2acaa811-a705-4394-87a1-3493f770bb56',
    'a49b95eb-463f-4ba1-90b2-070e2b883e33',
    'dad125cb-d8b5-4606-bdb7-ad16fa7a3ff8',
    '35577987-0f6f-4d12-9704-74fa8081cc8d',
    '45d39e53-c0df-410a-8724-3b93edc9bdf0',
    '6373e11d-beaa-48d6-8481-e8443c88ccd9',
    '67e0814a-2dc4-4d57-a3c2-d8d996922087',
    'e1f9fd30-1e1c-4f5f-b862-94776413c776',
    '1904117e-3e7f-4c09-b853-4c94d4aa0d09',
    'dac1b856-ea0e-4cec-98cd-3143cd199a97',
    '76cd9180-12aa-4b59-b82b-0e91393c2fe4',
    'e225e898-01ab-4c0c-a1a9-3abc9e7c602a',
    '1e4a4353-5275-4a28-9892-b6fa11d3ef29',
    '54cdcd18-1625-49cc-9164-6500e48f9172',
    '098da1eb-a7f0-4404-8de5-8f9cdbd5fbaf',
    '6031536b-4a12-4d0b-9777-cf3e0936fa24',
    '404d1047-dd73-4fbc-ab65-aaf9c2ca99b5',
    '25bb5ae1-338e-49ef-ac02-50f9608037b8',
    '640667e1-9c7a-4d0c-85fa-8881d49de910',
    'e5333bde-2a60-47ae-9e3a-0e2b6e336ddc',
    '0528ee3f-ba2e-45d9-8d86-39d0e262037f',
    '3b2297c5-7f6f-4074-b4b4-edfafe0f489e',
    // Add the rest from the output
];


  const audience = 'authenticated';
  const role = 'authenticated';

  // Initialize report object
  let report = {
    successfulRequests: [],
    errors: [],
    totalRequests: 0,
    successRate: 0,
  };

  // Send requests with random IPs and track success/error
  for (let i = 0; i < 20; i++) {
    const randomIP = generateRandomIP();
    const userId = userIds[Math.floor(Math.random() * userIds.length)];

    await generateTokenRequest(userId, audience, role, randomIP, report);
    report.totalRequests++;
  }

  // Calculate success rate after all requests are processed
  report.successRate = (report.successfulRequests.length / report.totalRequests) * 100;

  // Display the analysis report
  displayReport(report);
};

// Function to display the analysis report
const displayReport = (report) => {
  console.log('\n--- Batch Request Analysis Report ---');
  console.log(`Total Requests: ${report.totalRequests}`);
  console.log(`Successful Requests: ${report.successfulRequests.length}`);
  console.log(`Failed Requests: ${report.errors.length}`);
  console.log(`Success Rate: ${report.successRate.toFixed(2)}%`);
  console.log('\nFailed Requests Details:');
  report.errors.forEach((error, index) => {
    //console.log(`Error ${index + 1}: IP: ${error.ipAddress}, Error Message: ${error.error}`);
  });
};

// Run the batch request function
sendBatchRequests();
