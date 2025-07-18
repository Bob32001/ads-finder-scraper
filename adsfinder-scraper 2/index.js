const axios = require("axios");

const token = process.env.BRIGHTDATA_API_TOKEN;
const datasetId = process.env.BRIGHTDATA_DATASET_ID;

async function run() {
  try {
    const res = await axios.get(`https://api.brightdata.com/dca/dataset?dataset_id=${datasetId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data);
  } catch (error) {
    console.error("Erro:", error.response?.data || error.message);
  }
}

run();

