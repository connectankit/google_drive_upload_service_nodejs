var nodemailer = require("nodemailer");
const fs = require("fs");
const hbs = require("hbs");
const puppeteer = require("puppeteer");
const path = require("path");
const mime = require("mime");
const { google } = require("googleapis");
const { createUniqueFileName } = require("./utils");
const currentDirectory = process.cwd();
const readFile = require("util").promisify(fs.readFile);

const fileName = "invoice.pdf";
const sendMails = async ({ filePath, clientDetails } = {}) => {
  let  {toEmail="",subject="",text=""} = clientDetails
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ankitkumarasus@gmail.com",
      pass: "xszozafwxkxwicrc",
    },
  });
  let mailOptions = {
    from: "noreply@test.com",

    to: toEmail,
    subject: subject,
    text: text,
    attachments: [
      {
        filename: fileName,
        path: filePath
      }
    ]
  };
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error)
        reject({ msg: "erorr while sending mail please try it again" });
      } else {
        resolve({ msg: `mail sent successfully in ${clientDetails}` });
      }
    });
  });
};



const GOOGLE_API_FOLDER_ID = '1pzhJOoNjNy_ncRlSfch9xQwUgrRpC7b8'
// process.env.googleDriveFolderId;
const googleAuthConfig = () => {
  return new Promise((resolve, reject) => {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: "keys/googlekey.json",
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });
      const driveService = google.drive({
        version: "v3",
        auth,
      })
      resolve(driveService)
    } catch (error) {
      reject({msg:"error while config the google drive configration"})
    }
  })
}

exports.generateFile = async (requestUrl) => {
 
  console.log(`${requestUrl.protocol}://${requestUrl.get("host")}`,"base url")
  return new Promise(async (resolve, reject) => {
    let bodyData = requestUrl.body;
    const pdfData = {
    ...bodyData,
    baseUrl: `${requestUrl.protocol}://${requestUrl.get("host")}`, // http://localhost:3000
  };
    const options = {
      format: "A4",
    };

    try {
      const html = await readFile("views/invoice.hbs", "utf8");
      const template = hbs.compile(html);
      const content = template(pdfData);
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(content);
      const buffer = await page.pdf(options);
      await browser.close();
      const filename = "invoice_" + Date.now() + ".pdf";
      const subdirectoryName = 'generatedFiles'
      const dir = path.join(currentDirectory, subdirectoryName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      fs.writeFile(path.join(dir, filename), buffer, (err) => {
        if (err) {
          reject({
            msg: "error while saved PDF file"
          })
        } else {
          resolve({
            fileName: filename,
            msg: `PDF saved successfully ${filename}`
          })
        }
      });
    } catch (error) {
      console.log(error, "errorro")
      reject({
        msg: "error while creating the pdf file"
      })
    }

  })
}


exports.uploadFile = async ({ fileName }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let driveService = await googleAuthConfig()
      const fileMetaData = {
        name: fileName,
        parents: [GOOGLE_API_FOLDER_ID],
      };

      let pdfFile = fs.createReadStream(`generatedFiles/${fileName}`);

      pdfFile.on("error", (err) => {
        console.log(err);
        reject({
          msg: "error while reading the file",
        });
      });
      const media = {
        mimeType: mime.getType(pdfFile),
        body: pdfFile,
      };
      const response = await driveService.files.create({
        resource: fileMetaData,
        media: media,
        field: "id",
      });
      const fileId = response?.data?.id;
      deleteFile(`generatedFiles/${fileName}`)
      resolve({
        fileId: fileId,
        msg: "success",
      });
    } catch (err) {
      console.log(err, "ewerr")
      reject({
        msg: "unable to upload file ",
      });
    }
  });
};

exports.fetchFileFromDrive = async ({ fileId, clientDetails }) => {

  const subdirectoryName = 'fetchingFiles'
  const uniqueFileName = createUniqueFileName();
  const filePath = path.join(currentDirectory, subdirectoryName, uniqueFileName);
  return new Promise(async (resolve, reject) => {
    try {
      let driveService = await googleAuthConfig()
      const file = await driveService.files.get({
        fileId: fileId,
        alt: 'media',
      }, { responseType: 'stream' });
      const dest = fs.createWriteStream(filePath);
      file.data
        .on('error', err => {
          reject({ msg: "error while downloading file" });
        })
        .on('end', () => {
          console.log(`File downloaded to ${filePath}`);
        })
        .pipe(dest).on('close', () => {
          console.log(`File closed: ${filePath}`);
          sendMails({ filePath, clientDetails }).then((res) => {
            deleteFile(filePath)
            resolve({ msg: "file fetch and send successFully to client" })
          }).catch((err) => {
            reject(err);
            console.log("test",err)
          })
        })
        .on('error', (err) => {
          reject({ msg: "error while downloading file" });
        });

    } catch (error) {
      reject({ msg: "erorr while fetching file" })
    }
  })

}


function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`File ${filePath} has been deleted.`);
    }
  });
};





