$(document).ready(init);

var pause = false;
var deltaLimit = 0;
var wikipediaLimit = "all";
var namespaceLimit = "all";
var includeRobots = true;
var includeUsers = true;
var includeAnonymous = true;
var backgroundTimeout = 1000 * 7;
var showBackground = true;
var fetchingBackground = false;
var lastBackgroundChange = new Date() - backgroundTimeout;

function init() {
  setupControls();
    console.log('done setup')
  var socket = io.connect('tools-webgrid-tomcat.eqiad.wmflabs');
  socket.on('message', function(msg) {
      console.log('inside----',msg)
    // apply filters
    if (pause) return;
    /*
    if (! wikipediaFilter(msg)) return;
    if (! userFilter(msg)) return;
    if (! namespaceFilter(msg)) return;
    if (Math.abs(msg.delta) < deltaLimit) return;
    */
    // update the stream
    addUpdate(msg);
    removeOld();
  });
}

function addUpdate(msg) {
  var lang = $('<span>').attr({'class': 'lang'}).text('[' + msg.wiki + ']');
  var a = $('<a>').attr({'class': 'page', 'href': msg.server_url, 'title': msg.comment, target: '_new'}).text(msg.title);
  // TODO show doi
  //var delta = msg.
  //delta = $('<span>').attr({'class': 'delta'}).text(delta);

  updateClasses = ['update'];
  if (msg.type == 'new') updateClasses.push('newPage');
  // if (msg.unpatrolled) updateClasses.push('unpatrolled');

  var d = $('<div>').attr({'class': updateClasses.join(' ')})
    .append(userIcon(msg))
    .append(lang)
    .append(a)
    .append(1) // TODO put delta here
    .hide();
  $('#updates').prepend(d);
  d.slideDown('medium');
}

function removeOld() {
  // remove the old stuff
  var old = $('.update').slice(30)
  old.fadeOut('fast', function() { old.detach(); });
}

function togglePause() {
  pause = ! pause;
  if (pause) {
    $('header').block({ 
      message: '<br/>Paused<br/>Press \'p\' to unpause', 
      css: {
        'border': 'none',
        'color': 'black',
        'opacity': '1',
        'width': '280px',
        'height': '70px'
      }
    });
  } else {
    $('header').unblock();
  }
}

function userIcon(msg) {
  // construct a link to the user profile
  wikipediaHost = msg.server_url
  userLink= $("<a>").attr({
    href: wikipediaHost+"/wiki/User:"+msg.user,
    target: '_new',
  });

  var src = title = null;
  if (msg.bot) {
    src = '/images/robot.png';
    title = 'Bot: ';
//  } else if (msg.anonymous) {
//    src = '/images/question.png';
//    title = 'Anonymous: '; TODO check if msg.user is an IP address
  } else {
    src = '/images/person.png';
    title = 'User: ';
  }
  return userLink.append($("<img>").attr({src: src, title: title + msg.user}));
}

function setupControls() {
  $('#slider').slider({
    range: 'min',
    value: 0,
    min: 0,
    max: 1000,
    step: 50,
    slide: function(event, ui) {
      deltaLimit = parseInt(ui.value);
      $('#deltaLimit').text(ui.value);
    }
  });

  $('select[name="wikis"]').change(function() {
    wikipediaLimit = ($('select[name="wikis"]').val());
    $.bbq.pushState({wiki: wikipediaLimit.replace("#", "")});
  });

  /* don't display changing backgrounds on mobile devices */
  if (isMobile()) {
    $('input[name="background"]').attr('checked', false);
    showBackground = false;
  }

  $('input[type="checkbox"]').change(function() {
    var name = $(this).attr("name");
    var checked = $(this).is(":checked");

    console.log(name + ": " + checked);

    if (name == "user") {
      includeUsers = checked;
    } else if (name == "robot") {
      includeRobots = checked;
    } else if (name == "anonymous") {
      includeAnonymous = checked;
    } else if (name == "background") {
      showBackground = checked; 
    }
    var state = {};
    state[name] = checked;
    $.bbq.pushState(state, checked)
  });
  $('select[name="namespace"]').change(function() {
    namespaceLimit = ($('select[name="namespace"]').val());
    $.bbq.pushState({namespace: $('select[name="namespace"]').val()});
  });
  $(document).bind('keyup', 'p', togglePause);
  $(document).bind('keyup', 'pause', togglePause);

  // see if hash frag determines some of the control settings
  if ($.bbq.getState("wiki")) {
    $('select[name="wikis"]')
        .val("#" + $.bbq.getState("wiki"))
        .change();
  }
  if ($.bbq.getState("namespace")) {
    $('select[name="namespace"]')
      .val($.bbq.getState("namespace"))
      .change();
  }
  if ($.bbq.getState("robot") == "false") {
    $('input[name="robot"]').prop('checked', false).change();;
  }
  if ($.bbq.getState("anonymous") == "false") {
    $('input[name="anonymous"]').prop('checked', false).change();;
  }
  if ($.bbq.getState("user") == "false") {
    $('input[name="user"]').prop('checked', false).change();;
  }
}

function wikipediaFilter(msg) {
  if (wikipediaLimit == "all") return true;
  if (wikipediaLimit == msg.wiki) return true;
  return false;
}

function namespaceFilter(msg) {
  if (namespaceLimit == "all") return true;
  if (namespaceLimit == msg.namespace) return true;
  return false;
}

function userFilter(msg) {
  if (! includeRobots && msg.bot) {
    return false;
//  } else if (! includeAnonymous && msg.anonymous) {
//    return false; // TODO check if user is IP address
//  } else if (! includeUsers && (! msg.anonymous && ! msg.bot)) {
//    return false;
  }
  return true;
}

function isMobile() {
  return screen.width <= 480;
}
