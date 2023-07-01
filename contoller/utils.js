const fileExtension = '.pdf';
exports.createUniqueFileName = () => {
    const currentDate = new Date();
    const uniqueFileName = currentDate.getTime() + fileExtension;
    return uniqueFileName;
};