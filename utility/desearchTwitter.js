import Desearch from "desearch-js"
//import { normalize,similarity } from "../twitterCheck.js";
import { DESEARCH_API } from '../config.js';

const desearch = new Desearch(DESEARCH_API)

/*
const result = await desearch.twitterSearch({
  query: 'smileysrcoin',
  sort: 'Top'
})

console.log(result)
*/
export async function searchTwitter(username, queryPrompt) {

const basicTwitterResult = await Desearch.basicTwitterSearch({
    query: queryPrompt, //"Whats going on with Bittensor",
    sort: "Top",
    user: username,
    //start_date: "2024-12-01",
    //end_date: "2025-02-25",
    //lang: "en",
    verified: false,
    blue_verified: false,
   /* is_quote: true,
    is_video: true,
    is_image: true,*/
   // min_retweets: 1,
   // min_replies: 1,
    min_likes: 1,
    count: 10
});
console.log(basicTwitterResult);

}
/*
const twitterLinksResult = await desearch.twitterLinksSearch({
    prompt: "Bittensor"
          count: 10,
  });
  console.log(twitterLinksResult);


  const axios = require("axios");

const url = "https://apis.datura.ai/twitter";

const headers = {
  Authorization: "<your-api-key>",
  "Content-Type": "application/json",
};

const params = {
  query: "Bittensor",
  blue_verified: false,
  end_date: "2025-02-17",
  is_image: false,
  is_quote: false,
  is_video: false,
  lang: "en",
  min_likes: 0,
  min_replies: 0,
  min_retweets: 0,
  sort: "Top",
  start_date: "2025-02-16",
  count: 10,
};

axios
  .get(url, {
    headers,
    params,
  })
  .then((response) => console.log(response.data))
  .catch((error) =>
    console.error("Error:", error.response?.data || error.message)
  );

    */