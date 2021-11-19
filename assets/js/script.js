var certs = {};

var createCert = function(certText, certDate, certList) {
  // create elements that make up a cert item
  var certLi = $("<li>").addClass("list-group-item");
  var certSpan = $("<span>").addClass("badge badge-primary badge-pill").text(certDate);
  var certP = $("<p>").addClass("m-1").text(certText);

  // append span and p element to parent li
  certLi.append(certSpan, certP);

  // append to ul list on the page
  $("#list-" + certList).append(certLi);

  // check due date
  auditCert(certLi);

  // append to ul list on the page
  $("#list-" + certList).append(certLi);
};

var loadCerts = function() {
  certs = JSON.parse(localStorage.getItem("certs"));

  // if nothing in localStorage, create a new object to track all cert status arrays
  if (!certs) {
    certs = {
      upToDate: [],
      approaching: [],
      needsAttention: [],
      expired: []
    };
  }

  // loop over object properties
  $.each(certs, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(cert) {
      createCert(cert.text, cert.date, list);
    });
  });
};

var saveCerts = function() {
  localStorage.setItem("certs", JSON.stringify(certs));
};


// p was clicked
$(".list-group").on("click", "p", function() {
  var text = $(this).text().trim();
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

// anywhere outside textarea was clicked
$(".list-group").on("blur", "textarea", function() {
  // get the textarea's current value/text
  var text = $(this).val().trim();

  // get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the cert's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  certs[status][index].text = text;
  saveCerts();

  // replace p element
  var certP = $("<p>").addClass("m-1").text(text);

  // replace textarea with p element
  $(this).replaceWith(certP);
});

// due date was clicked
$(".list-group").on("click", "span", function() {
  // get current text
  var date = $(this).text().trim();

  // create new input element
  var dateInput = $("<input>").attr("type", "text").addClass("form-control").val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 0,
    onClose: function() {
      // when calendar is closed, force a "change" event on the 'dateInput'
      $(this).trigger("change");
    }
  });

  // automatically bring up the calendar
  dateInput.trigger("focus");
});

// anywhere outside of due date was clicked after due date was changed
$(".list-group").on("change", "input[type='text']", function() {
  // get current text
  var date = $(this).val().trim();

  // get parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get cert's position in the list of ther li elements
  var index = $(this).closest(".list-group-item").index();

  // update cert in array an re-save to localStorage
  certs[status][index].date = date;
  saveCerts();

  // recreate span element with bootstrap classes
  var certSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);

  // replace input with span element
  $(this).replaceWith(certSpan);

  // Pass cert's <li> element into auditCert() to check new date
  auditCert($(certSpan).closest(".list-group-item"));
});


// modal was triggered
$("#cert-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalCertName, #modalExpDate").val("");
});

// modal is fully visible
$("#cert-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalCertName").trigger("focus");
});

// save button in modal was clicked
$("#cert-form-modal .btn-save").click(function() {
  // get form values
  var certText = $("#modalCertName").val();
  var certDate = $("#modalExpDate").val();

  if (certText && certDate) {
    createCert(certText, certDate, "upToDate");

    // close modal
    $("#cert-form-modal").modal("hide");

    // save in certs array
    certs.upToDate.push({
      text: certText,
      date: certDate
    });

    saveCerts();
  }
});

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function(event) {
    // array to store the cert data in
    var tempArr =[];

    // loop over current set of children in sortable list
    $(this).children().each(function() {
      var text = $(this).find("p").text().trim();
      var date = $(this).find("span").text().trim();

      // add cert data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });

    // trim down list's ID to match object property
    var arrName = $(this).attr("id").replace("list-", "");

    //update array on certs object and save
    certs[arrName] = tempArr;
    saveCerts();

    console.log(tempArr);
  }
});

$(trash).droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass(".bottom-trash-active");
  },
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass(".bottom-trash-active");
  }
});

$("#modalExpDate").datepicker({
  changeMonth: true,
  changeYear: true,
  minDate: 0
});

// Due date audits
var auditCert = function(certEl) {
  // get date from cert element
  var date = $(certEl).find("span").text().trim();

  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);

  // remove any old classes from element
  $(certEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if cert is near/over due date
  if (moment().isAfter(time)) {
    $(certEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(certEl).addClass("list-group-item-warning");
  }
};

// load certs for the first time
loadCerts();

setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditCert(el);
  });
}, 1000 * 60 * 30);
