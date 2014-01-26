//self-defined anonymous function instead of onLoad()
jQuery(document).ready(function ($) {

    //Sign In button click and go to the sensor list with prevented Default()
    $('form.form-signin').submit(function (event) {
        event.preventDefault();
    });
    $('button:submit').click(function () {
        $('form.form-signin').hide();
        $('div.content').show();
    });
    getSensorsList();

    //update sensor list by clicking on Sensor List in nav.bar
    $('#update_list').click(getSensorsList);

    //Tabs
    $('#update_list a').click(function (e) {
          e.preventDefault()
          $(this).tab('show')
        })
     $('#data_results a').click(function (e) {
          e.preventDefault()
          $(this).tab('show')
        })
       $('#favorites a').click(function (e) {
          e.preventDefault()
          $(this).tab('show')
        })
     $('#settings a').click(function (e) {
          e.preventDefault()
          $(this).tab('show')
        })

});
//parsing of Registry data and creating html structure
function getSensorsList() {
    $.ajax({
        dataType: "JSON",
        url: "registry.txt",
        success: registry_parsing,
    });
}

$('body').scrollspy({ target: '.sensros_wrapper' })
var json;
function registry_parsing(sensor_json) {
    json = sensor_json;
    console.log(json);
    $('#sensor_list').empty();

    for (var i = 0; i < json.sensor_list.length; i++) {
        if (json.sensor_list[i].availability == true) {
            var sensor = json.sensor_list[i];

            var tag_icon = "<div class='icon col-md-2'><img class='img-responsive' src='" + sensor.icon + "'></img></div>";
            var tag_title = "<div class='title col-md-10'><h3>" + sensor.title + "</h3></div>";
            var tag_description = "<span class='description col-md-12'>" + sensor.description + "</span>";
            var tag_sla = "<div class='alert alert-success fade-in'><h4>If you want to receive all data,please accept the next SLA:</h4><p>" + sensor.sla + "</p><p><button type='button' class='btn btn-danger'>Decline</button><button type='button' class='btn btn-success'>Accept</button></p></div>";
            var tag_subscribe = "<span class='subscribe col-sm-4'><button class='subscribe btn btn-primary' data-toggle='tooltip' data-placement='bottom' type='button' style='margin-top:10px' id='" + sensor.id + "'>Subscribe</button>" + tag_sla + "</span>";


            //check availability of preview if yes then sho preview if not substitude to tag_preview to tag_icon
            if (sensor.preview != '') {
                //Button that triggers modal
                var tag_get_preview = "<span class='preview col-sm-4'><button type='button' class='preview btn btn-primary' data-toggle='modal' data-target='#myModal' style='margin-top:10px'>Preview</button></span>";
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
    $('button.preview').click(function(){
       console.log($(this));
       var preview = $(this).parent().nextAll('div.preview_content').html();
       $('div.modal-body').html(preview);
       });

    //accept SLA in alert window
      $('.subscribe>button.subscribe').click(function (){
           $(this).nextAll('div.alert').alert();
     //   var result = confirm(sla); //put SLA text there
     //   if (result == true) {
      //$('button.btn-default').click(function(){
     //       $('div.alert').fadeOut();
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
}