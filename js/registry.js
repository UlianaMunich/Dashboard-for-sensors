//self-defined anonymous function instead of onLoad()
jQuery(document).ready(function ($) {

    getSensorsList();

    //update sensor list by clicking on Sensor List in nav.bar
    $('#update_list').click(getSensorsList);
  
  });
//parsing of Registry data and creating html structure
function getSensorsList() {
    $.ajax({
        dataType: "JSON",
        url: "registry.txt",
        success: registry_parsing,
    });
}

var json;
function registry_parsing(sensor_json) {
    json = sensor_json;
    console.log(json);
    $('#sensor_list').empty();

    for (var i = 0; i < json.sensor_list.length; i++) {
        if (json.sensor_list[i].availability == true) {
            var sensor = json.sensor_list[i];

            var tag_icon = "<div class='icon col-md-2'><img class='img-responsive' src='" + sensor.icon + "'></img></div>";
            var tag_description = "<span class='description col-md-12'>" + sensor.description + "</span>";
            var tag_sla = "<div class='sla'><p>" + sensor.sla + "</p></div>";
            var tag_subscribe = "<div class='subscribe col-sm-4'><button class='subscribe btn btn-primary' data-toggle='tooltip' data-placement='bottom' type='button' style='margin-top:10px' id='" + sensor.id + "'>Subscribe</button>" + tag_sla + "</div>";
            var tag_favorites = "<div class='favorites col-md-2'><button id='favorites' type='button' class='btn btn-default favorit_star'><img class='star img-responsive' src='img/star.png'/></button></div>";
            var tag_title = "<div class='title col-md-8'><h3>" + sensor.title + "</h3></div>" + tag_favorites;
            
            //check availability of preview if yes then sho preview if not substitude to tag_preview to tag_icon
            if (sensor.preview != '') {
                //Button that triggers modal
                var tag_get_preview = "<span class='preview col-sm-4'><button type='button' class='preview btn btn-primary'>Info</button></span>";
                var tag_preview_content = "<div class='preview_content'><p>Before you decide to subscribe to any type of service, you can review the information provided by the service.</p><img class='img-responsive' src='" + sensor.preview + "'/></div>";
                var tag_sensor = "<div class='col-md-4' id='" + sensor.id + "'><div class='sensor'><div class='row'>" + tag_icon + tag_title + tag_description + "</div><div class='row'>" + tag_subscribe + tag_get_preview + tag_preview_content + "</div></div></div>";

            } else {
                var tag_sensor = "<div class='col-md-4' id='" + sensor.id + "'><div class='sensor'><div class='row'>" + tag_icon + tag_title + tag_description + "</div><div class='row'>" + tag_subscribe + "</div></div></div>";

            }

            $('#sensor_list').append(tag_sensor);
            //limitation of symbols number in descrition field
            $("span.description").each(function (i) {
                len = $(this).text().length;
                if (len > 300) {
                    $(this).text($(this).text().substr(0, 300) + '...');
                }
            });
        }
    };
   // $('button.preview').click(function(){
   //    console.log($(this));
   //    var preview = $(this).parent().nextAll('div.preview_content').html();
   //   $('div.modal-body').html(preview);
    //   });
    $('button.subscribe').click(function(){
       var sla_accept = $(this).nextAll('div.sla').find('p').html();
      $('div.modal-body').html(sla_accept);
      $('#myModal').modal('show');
      });

    //accept SLA in alert window
      $('.subscribe>button.subscribe').click(function (){
            $(this).removeClass('btn-primary').addClass('btn-success').text('Subscribed');
            $('div.graph').show();
           });

       //tooltip for buttons
        $('button.subscribe').tooltip({
            title: 'Subscription to a service',
            content: $(this).next().text()
        });
        $('button.preview').tooltip({
            title: 'Get a free preview'
        });

       //Add icon favorites sensors
     $('button.favorit_star').click(function(){
             var $this = $(this);
            $this.children('img').attr('src','img/star_yellow.png');
     });
}
