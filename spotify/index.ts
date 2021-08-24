import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { exit } from "process";
var azure = require('azure-storage');

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    // context.bindings.database = [];

    // context.bindings.database.push({
    //     PartitionKey: "myKey",
    //     RowKey: "myRow",
    //     Name: "hello"
    // });

    const storageKey = process.env['StorageKey'];
    if (!storageKey) {
        console.log("ERR: StorageKey not set!")
        exit(1)
    }

    var tableSvc = azure.createTableService('spotifynowplayingstorage', storageKey);
    

    var updatedTask = {
        PartitionKey: {'_':'myKey'},
        RowKey: {'_': 'myRow'},
        Name: {'_': 'updated'}
    };

    tableSvc.replaceEntity('database', updatedTask, function(error, result, response){
        if(!error) {
          // Entity updated
          console.error(error)
        }
      });

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };

    context.done()

};

export default httpTrigger;