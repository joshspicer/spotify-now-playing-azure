## Setup

1. Clone
1. Get Spotify secrets, like outlined in my [old guide](https://joshspicer.com/spotify-now-playing)
1. Deploy with the VSCode 'Azure Functions' extension, with a storage account
1. In the Azure Portal, navigate to your storage account
    1. Manually create a table with whatever name you'd like
    1. Fill in `StorageKey`, `StorageAccountName`, and `TableName` in your Azure Function's settings (and local settings if you want to debug)