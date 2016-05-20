var notShown = true, filePreviewWrapper, currentClampState = true;
function loadFile(file) {
  if(supportedImage(file)) {
    loadImage(file);
  }
  else if(file.type === "video/webm") {
    loadWebm(file);
  }
  else {
    hideWrapper();
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var hash = CryptoJS.SHA3(this.result).toString();
    sendQueryPacket(hash, file.name);
  }
  reader.readAsText(file);
}

function hideWrapper() {
  if(filePreviewWrapper)
    filePreviewWrapper.style.display = "none";
}

function showWrapper() {
  if(filePreviewWrapper)
    filePreviewWrapper.style.display = "";
}

function loadImage(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    pruneOldFile();
    var img = document.createElement("img");
    img.id = "file-preview";
    img.src = this.result;
    img.classList.add("clamped");
    setClampedState(true);
    filePreviewWrapper.appendChild(img);
    showWrapper();
  }
  reader.readAsDataURL(file);
}

function setClampedState(state) {
  if(typeof state != "boolean") {
    state = undefined;
  }
  console.log(state);
  state = state || !currentClampState;
  console.log("toggled", state);
  currentClampState = state;
  var preview = document.getElementById("file-preview");
  if(preview) {
    if(state)
      preview.classList.add("clamped");
    else
      preview.classList.remove("clamped");
  }
  document.getElementById("clamp-button").innerText = state ? "unclamp" : "clamp";
}

function loadWebm(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    pruneOldFile();
    var video = document.createElement("video");
    video.id = "file-preview";
    video.controls = "controls";
    video.src = this.result;
    filePreviewWrapper.appendChild(video);
    showWrapper();
  }
  reader.readAsDataURL(file);
}

function pruneOldFile() {
  var old = document.getElementById("file-preview");
  if(old) {
    old.parentElement.removeChild(old);
  }
}

document.addEventListener("DOMContentLoaded", function() {
  filePreviewWrapper = document.getElementById("file-preview-wrapper");
  document.addEventListener("click", function(e) {
    console.log(e.target);
  })
  document.getElementById("clamp-button").addEventListener("click", function() {
    try {
      setClampedState();
    } catch(e) {
      console.log(e);
    }
  })
  var chooser = document.getElementById("fileChooser");
  console.log("page loaded")
  chooser.addEventListener("change", function(e) {
    var file = this.files[0];
    console.log(file);
    if(file)
      loadFile(file);
  });
});

function sendQueryPacket(hash, name) {
  var body = {};
  body.srcId = encodeURIComponent(hash);
  body.name = name;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/source", true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.onload = function() {
    try {
      var response = JSON.parse(this.responseText);
      return buildSource(response, name);
    } catch(e) {
      console.log(e);
      alert("Could not decode the response");
      throw new Error("Could not decode the response");
    }
  }
  xhr.send(encodeObj(body));
}

function buildSource(source, name) {
  console.log(source)
  if(notShown) {
    document.querySelector(".invisible").classList.remove("invisible");
    notShown = false;
  }
  var namesEl = document.getElementById("names");
  if(!source.names || source.names.length == 0)
    namesEl.innerHTML = "No Known Names";
  document.getElementById("source-id").innerHTML = "HASH: " +source.id.replace("<", "&lt;").replace(">", "&gt;");
  document.getElementById("source-name").innerHTML = "NAME: " + name;
  var commentWrapper = document.getElementById("source-comments")
  commentWrapper.innerHTML = "No Sources";
  for(var i = 0; i < source.sources.length; i++) {
    var el = document.createElement("div");
    el.classList.add("source-comment");
    el.innerHTML = source.sources[i].source.replace("<", "&lt;").replace(">", "&gt;");
  }
}

function encodeObj(obj) {
  var str = "";
  var first = true;
  for(key in obj) {
    if(!first) {
      str += "&"
    }
    first = false;
    str += encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]);
  }
  return str;
}

function supportedImage(file) {
  return file.type == "image/png" || file.type == "image/gif" || file.type == "image/jpeg";
}