
//Author Manohar - Mult search Tagging


if (digitalData) {
  if (digitalData.page && digitalData.page.search) {
    var multiSearchTerms = digitalData.page.search[0];
   b.multiSearchKeywords = multiSearchTerms.multiSearchKeywords;
   b.multiSearchNumber = multiSearchTerms.multiSearchNumber;
  }
}
  
