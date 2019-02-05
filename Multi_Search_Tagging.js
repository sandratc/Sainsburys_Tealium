
//Author Manohar - Mult search Tagging . - test file
//Manohar will find a new job


if (digitalData) {
  if (digitalData.page && digitalData.page.search) {
    var multiSearchTerms = digitalData.page.search[0];
   b.multiSearchKeywords = multiSearchTerms.multiSearchKeywords;
   b.multiSearchNumber = multiSearchTerms.multiSearchNumber;
  }
}
  
