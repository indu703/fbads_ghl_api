import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service:"gmail",
    host: process.env.EMAIL_HOST,
    port: 465, // Use 587 for local gmail email ids
    secure: true, // Use false for local gmail email ids
    // requireTLS: true,
    // tls: {
    //     rejectUnauthorized: false
    //   },
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    logger: true
    
});

const sendForgotEmail = (link: any, email: string) => {
    const message = {
        from: process.env.SENDER_EMAIL_ADDRESS,
        to: email,
        subject: 'Reset Password',
        text: `To reset your password, please click the link below.\n\n ${link}`
    };

    //send email
    transporter.sendMail(message, function (err:any, info:any) {
        if (err) { console.log(err) }
        else { console.log('sent'); }
    });
}
const sendEmail = (html: any, email: any, subject: any, from?:any, cc?: any, attachment?: any) => {
    return new Promise((resolve, reject) => {
    const message = {
        from: from?from:process.env.SENDER_EMAIL_ADDRESS,
        to: email,
        subject: subject,
        html: html,
        cc: cc,
        attachments: attachment
    };

    //send email
    transporter.sendMail(message, function (err:any, info:any) {
        if (err) { 
            console.log(err);  
            resolve(false);
        }
        else { 
            console.log('sent'); 
        resolve(true);
    }
    });
});
}


export { sendForgotEmail ,sendEmail}