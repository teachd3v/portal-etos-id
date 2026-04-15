import { google } from "googleapis";

export const getGoogleClient = () => {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oAuth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    return oAuth2Client;
};

export const gmailAPI = google.gmail({ version: 'v1', auth: getGoogleClient() });
export const sheetsAPI = google.sheets({ version: 'v4', auth: getGoogleClient() });
