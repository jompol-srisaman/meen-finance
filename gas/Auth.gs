// Auth.gs — API key management via PropertiesService

function setApiKey() {
  // Run this ONCE manually from the GAS editor to set your API key.
  // Change the value below to any secret string before running.
  const MY_API_KEY = '3080759533cd0cdc02401db6803306168f874e4772ada356';
  PropertiesService.getScriptProperties().setProperty('API_KEY', MY_API_KEY);
  Logger.log('API key set: ' + MY_API_KEY);
}

function validateApiKey(key) {
  if (!key) return false;
  const stored = PropertiesService.getScriptProperties().getProperty('API_KEY');
  return stored && key === stored;
}
