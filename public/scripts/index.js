// index.js

let REST_DATA = 'api/favorites';
let KEY_ENTER = 13;
let defaultItems = [

];

function encodeUriAndQuotes(untrustedStr) {
    return encodeURI(String(untrustedStr)).replace(/'/g, '%27').replace(')', '%29');
}

function loadItems() {
    xhrGet(REST_DATA, function(data) {

        //stop showing loading message
        stopLoadingMessage();

        let receivedItems = data || [];
        let items = [];
        let i;
        // Make sure the received items have correct format
        for (i = 0; i < receivedItems.length; ++i) {
            let item = receivedItems[i];
            if (item && 'id' in item) {
                items.push(item);
            }
        }
        let hasItems = items.length;
        if (!hasItems) {
            items = defaultItems;
        }
        for (i = 0; i < items.length; ++i) {
            addItem(items[i], !hasItems);
        }
        if (!hasItems) {
            let table = document.getElementById('notes');
            let nodes = [];
            for (i = 0; i < table.rows.length; ++i) {
                nodes.push(table.rows[i].firstChild.firstChild);
            }

            function save() {
                if (nodes.length) {
                    saveChange(nodes.shift(), save);
                }
            }
            save();
        }
    }, function(err) {
        console.error(err);
    });
}

function startProgressIndicator(row) {
    row.innerHTML = "<td class='content'>Uploading file... <img height=\"50\" width=\"50\" src=\"images/loading.gif\"></img></td>";
}

function removeProgressIndicator(row) {
    row.innerHTML = "<td class='content'>uploaded...</td>";
}

function addNewRow(table) {
    let newRow = document.createElement('tr');
    table.appendChild(newRow);
    return table.lastChild;
}

function uploadFile(node) {


	console.log("Inside uplaodfile");
    let file = node.previousSibling.files[0];
    //let file = document.getElementById("upload_file").files[0];

    //if file not selected, throw error
    if (!file) {
        alert("File not selected for upload... \t\t\t\t \n\n - Choose a file to upload. \n - Then click on Upload button.");
        return;
    }
    
    let data = new FormData();
    
    let row = node.parentNode.parentNode.parentNode;

    let id = row.getAttribute('data-id');

    let queryParams = "id=" + (id === null ? -1 : id);
    queryParams += "&name=" + row.firstChild.firstChild.value;
    queryParams += "&value=" + row.firstChild.nextSibling.firstChild.value;
    
    let table = row.firstChild.nextSibling.firstChild;
    let newRow = addNewRow(table);

    startProgressIndicator(newRow);


	data.append("file", file, row.firstChild.firstChild.value);
 
	let xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	
	xhr.addEventListener("readystatechange", function() {
	  if(this.readyState === 4) {
			if(xhr.status === 200){
				let item = parseJson(xhr.responseText) 
        		console.log('Item id - ' + item.id);
        		console.log('attached: ', item);
        		row.setAttribute('data-id', item.id);
        		removeProgressIndicator(row);
        		setRowContent(item, row);
				console.log("Document successfully uploaded!")
			}else{
				console.error(xhr.status+" "+xhr.statusText);
			}
	  }
	});
	
	xhr.open("POST", REST_DATA + "/attach?" + queryParams, true);
	xhr.send(data);
}

let attachButton = "<br><div class='uploadBox'><input type=\"file\" name=\"file\" id=\"upload_file\"><input width=\"100\" type=\"submit\" value=\"Upload\" onClick='uploadFile(this)'></div>";

function setRowContent(item, row) {
    let innerHTML = "<td class='contentName'><textarea id='nameText' class = 'nameText' onkeydown='onKey(event)'>" + item.name + "</textarea></td><td class='contentDetails'>";

    let valueTextArea = "<textarea id='valText' onkeydown='onKey(event)' placeholder=\"Enter a description...\"></textarea>";
    if (item.value) {
        valueTextArea = "<textarea id='valText' onkeydown='onKey(event)'>" + item.value + "</textarea>";
    }

    innerHTML += valueTextArea;


    let attachments = item.attachements;
    if (attachments && attachments.length > 0) {
        innerHTML += "<div class='flexBox'>";
        for (let i = 0; i < attachments.length; ++i) {
            let attachment = attachments[i];

            if (attachment.content_type.indexOf("image/") == 0) {
                innerHTML += "<div class='contentTiles'>" + attachment.key + "<br><img height=\"150\" src=\"" + encodeUriAndQuotes(attachment.url) + "\" onclick='window.open(\"" + encodeUriAndQuotes(attachment.url) + "\")'></img></div>";

            } else if (attachment.content_type.indexOf("audio/") == 0) {
                innerHTML += "<div class='contentTiles'>" + attachment.key + "<br><AUDIO  height=\"50\" src=\"" + encodeUriAndQuotes(attachment.url) + "\" controls></AUDIO></div>";

            } else if (attachment.content_type.indexOf("video/") == 0) {
                innerHTML += "<div class='contentTiles'>" + attachment.key + "<br><VIDEO  height=\"150\" src=\"" + encodeUriAndQuotes(attachment.url) + "\" controls></VIDEO></div>";

            } else if (attachment.content_type.indexOf("text/") == 0 || attachment.content_type.indexOf("application/") == 0) {
                innerHTML += "<div class='contentTiles'><a href=\"" + encodeUriAndQuotes(attachment.url) + "\" target=\"_blank\">" + attachment.key + "</a></div>";
            }

        }
        innerHTML += "</div>";

    }

    row.innerHTML = innerHTML + attachButton + "</td><td class = 'contentAction'><span class='deleteBtn' onclick='deleteItem(this)' title='delete me'></span></td>";

}

function addItem(item, isNew) {

    let row = document.createElement('tr');
    row.className = "tableRows";
    let id = item && item.id;
    if (id) {
        row.setAttribute('data-id', id);
    }



    if (item) // if not a new row
    {
        setRowContent(item, row);
    } else //if new row
    {
        row.innerHTML = "<td class='contentName'><textarea id='nameText' onkeydown='onKey(event)' placeholder=\"Enter a title for your favourites...\"></textarea></td><td class='contentDetails'><textarea id='valText'  onkeydown='onKey(event)' placeholder=\"Enter a description...\"></textarea>" + attachButton + "</td>" +
            "<td class = 'contentAction'><span class='deleteBtn' onclick='deleteItem(this)' title='delete me'></span></td>";
    }

    let table = document.getElementById('notes');
    table.lastChild.appendChild(row);
    row.isNew = !item || isNew;

    if (row.isNew) {
        let textarea = row.firstChild.firstChild;
        textarea.focus();
    }

}

function deleteItem(deleteBtnNode) {
    let row = deleteBtnNode.parentNode.parentNode;
    let attribId = row.getAttribute('data-id');
    if (attribId) {
        xhrDelete(REST_DATA + '?id=' + row.getAttribute('data-id'), function() {
            row.parentNode.removeChild(row);
        }, function(err) {
            console.error(err);
        });
    } else if (attribId == null) {
        row.parentNode.removeChild(row);
    }
}

function onKey(evt) {

    if (evt.keyCode == KEY_ENTER && !evt.shiftKey) {

        evt.stopPropagation();
        evt.preventDefault();
        let nameV, valueV;
        let row;

        if (evt.target.id == "nameText") {
            row = evt.target.parentNode.parentNode;
            nameV = evt.target.value;
            valueV = row.firstChild.nextSibling.firstChild.value;

        } else {
            row = evt.target.parentNode.parentNode;
            nameV = row.firstChild.firstChild.value;
            valueV = evt.target.value;
        }

        let data = {
            name: nameV,
            value: valueV
        };

        if (row.isNew) {
            delete row.isNew;
            xhrPost(REST_DATA, data, function(item) {
                row.setAttribute('data-id', item.id);
            }, function(err) {
                console.error(err);
            });
        } else {
            data.id = row.getAttribute('data-id');
            xhrPut(REST_DATA, data, function() {
                console.log('updated: ', data);
            }, function(err) {
                console.error(err);
            });
        }


        if (row.nextSibling) {
            row.nextSibling.firstChild.firstChild.focus();
        } else {
            addItem();
        }
    }
}

function saveChange(contentNode, callback) {
    let row = contentNode.parentNode.parentNode;

    let data = {
        name: row.firstChild.firstChild.value,
        value: row.firstChild.nextSibling.firstChild.value
    };

    if (row.isNew) {
        delete row.isNew;
        xhrPost(REST_DATA, data, function(item) {
            row.setAttribute('data-id', item.id);
            callback && callback();
        }, function(err) {
            console.error(err);
        });
    } else {
        data.id = row.getAttribute('data-id');
        xhrPut(REST_DATA, data, function() {
            console.log('updated: ', data);
        }, function(err) {
            console.error(err);
        });
    }
}

function toggleServiceInfo() {
    let node = document.getElementById('vcapservices');
    node.style.display = node.style.display == 'none' ? '' : 'none';
}

function toggleAppInfo() {
    let node = document.getElementById('appinfo');
    node.style.display = node.style.display == 'none' ? '' : 'none';
}


function showLoadingMessage() {
    document.getElementById('loadingImage').innerHTML = "Loading data " + "<img height=\"100\" width=\"100\" src=\"images/loading.gif\"></img>";
}

function stopLoadingMessage() {
    document.getElementById('loadingImage').innerHTML = "";
}

showLoadingMessage();
//updateServiceInfo();
loadItems();
