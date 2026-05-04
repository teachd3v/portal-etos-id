export function wrapInEmailTemplate(htmlContent, subject) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f8f4;
            color: #333333;
        }
        .body-wrap {
            padding: 20px;
            background-color: #f4f8f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border: 1px solid #e2efe3;
        }
        .header {
            background-color: #2e5e33;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
            font-size: 16px;
        }
        .content p {
            margin-bottom: 16px;
            color: #4a5568;
        }
        .content a {
            color: #55a65b;
            text-decoration: none;
            font-weight: 600;
        }
        .content a:hover {
            text-decoration: underline;
        }
        .content ul, .content ol {
            padding-left: 20px;
            margin-bottom: 16px;
            color: #4a5568;
        }
        .content li {
            margin-bottom: 8px;
        }
        .content strong {
            color: #2d3748;
        }
        .footer {
            background-color: #f8faf8;
            padding: 20px;
            text-align: center;
            font-size: 13px;
            color: #718096;
            border-top: 1px solid #e2efe3;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 16px 36px;
            background-color: #55a65b;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 10px rgba(85, 166, 91, 0.3);
            border: 1px solid #468e4c;
            transition: all 0.3s ease;
        }
        @media only screen and (max-width: 480px) {
            .container {
                width: 100% !important;
                border-radius: 8px !important;
            }
            .content {
                padding: 25px 20px !important;
            }
            .button {
                display: block !important;
                width: 100% !important;
                padding: 18px 20px !important;
                box-sizing: border-box !important;
                font-size: 18px !important;
            }
        }
    </style>
</head>
<body>
    <div class="body-wrap">
        <div class="container">
            <div class="header">
                <h1>${subject}</h1>
            </div>
            <div class="content">
                ${htmlContent}
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Etos ID Scholarship. Hak cipta dilindungi undang-undang.</p>
                <p>Email ini dihasilkan secara otomatis oleh sistem, mohon tidak membalas email ini.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

export function injectVariables(template, userData) {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return userData[trimmedKey] || match;
  });
}
