const { sendMails, uploadFile, fetchFileFromDrive, generateFile } = require("./function");
const path = require("path");
const { createUniqueFileName } = require("./utils");

// join the current directory path with the file name

exports.uploadDocuments = async (req, res) => {
  try {
    let { fileName } = await generateFile(req)
    let { fileId } = await uploadFile({ fileName })
    console.log(fileId,"fileId")
    res.status(201).json({
      msg: "file upload successfully",
      fileId
    })
  } catch (error) {
    res.status(400).json(error)
  }
};


exports.sendFileToClient = (req, res) => {
  let { fileId, clientDetails } = req?.body
  fetchFileFromDrive({ fileId, clientDetails }).then((response) => {
    res.status(200).json(response)
  }).catch((err) => {
    res.status(400).json(err)
  })
}
