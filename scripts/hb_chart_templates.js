
// Retrieve the template data from the HTML (jQuery is used here).
var template = $('#nautilus').html();

// Compile the template data into a function
var templateScript = Handlebars.compile(template);

var data1 = [{
   LO_id: "lo1",
   LO_name: "Grammar 1",
   active_time: 368,
   attempts: 1,
   best_score: 75,
   first_score: 75,
   status: "aboveTarget"
  },
  {
   LO_id: "lo2",
   LO_name: "Grammar 2",
   active_time: 368,
   attempts: 1,
   best_score: 75,
   first_score: 75,
   status: "aboveTarget"
  }
];

var data = [{
    Category: "General",
    DocumentList: [{
        DocumentName: "Document Name 1 - General",
        DocumentLocation: "Document Location 1 - General"
    }, {
        DocumentName: "Document Name 2 - General",
        DocumentLocation: "Document Location 2 - General"
    }]
}, {
    Category: "Unit Documents",
    DocumentList: [{
        DocumentName: "Document Name 1 - Unit Documents",
        DocumentList: "Document Location 1 - Unit Documents"
    }]
}, {
    Category: "Minutes"
}];

   var html = templateScript({apidata: data1});

// Insert the HTML code into the page
$(document.body).append(html);


/////////////////////////////////////////////


//Chartist chart stuff

var chart = new Chartist.Pie('.ct-chart', 
                             {
  series: [160, 60, 140 ],
  labels: ['', '']
}, {
  donut: true,
  donutWidth: 40,
  startAngle: 0,
  total: 360,
  showLabel: false,
  plugins: [
    Chartist.plugins.fillDonut({
      items: [{
        content: '<i class="fa fa-tachometer"></i>',
        position: 'bottom',
        offsetY : 10,
        offsetX: -2
      }, {
        content: '<h3>53<span class="small">%</span></h3>'
      }]
    })
  ],
});

chart.on('draw', function(data) {
  if(data.type === 'slice' && data.index == 0) {
    // Get the total path length in order to use for dash array animation
    var pathLength = data.element._node.getTotalLength();

    // Set a dasharray that matches the path length as prerequisite to animate dashoffset
    data.element.attr({
      'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
    });

    // Create animation definition while also assigning an ID to the animation for later sync usage
    var animationDefinition = {
      'stroke-dashoffset': {
        id: 'anim' + data.index,
        dur: 1200,
        from: -pathLength + 'px',
        to:  '0px',
        easing: Chartist.Svg.Easing.easeOutQuint,
        fill: 'freeze'
      }
    };

    // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
    data.element.attr({
      'stroke-dashoffset': -pathLength + 'px'
    });

    // We can't use guided mode as the animations need to rely on setting begin manually
    // See http://gionkunz.github.io/chartist-js/api-documentation.html#chartistsvg-function-animate
    data.element.animate(animationDefinition, true);
  }
});
