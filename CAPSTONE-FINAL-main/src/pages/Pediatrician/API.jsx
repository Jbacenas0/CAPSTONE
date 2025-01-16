//This is the Auth token, you will use it to generate a meeting and connect to it
export const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqYmFjZW5hczBAZ21haWwuY29tIiwidXNlclR5cGUiOiJQZWRpYXRyaWNpYW4iLCJpYXQiOjE3MzcwNTY4MzQsImV4cCI6MTczNzA2MDQzNH0.bnS7VzxbhxhnFcxSsXZTybuCmJZzJ-naSPTf0FfLD18";
// API call to create a meeting
export const createMeeting = async ({ token }) => {
  const res = await fetch(`https://api.videosdk.live/v2/rooms`, {
    method: "POST",
    headers: {
      authorization: `${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  //Destructuring the roomId from the response
  const { roomId } = await res.json();
  return roomId;
};