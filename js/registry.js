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
    $('#update_list').click(getSensorsList);  \

});
//parsing of Registry data and creating html structure
function getSensorsList() {
    $.ajax({
        dataType: "JSON",
        url: "registry.txt",
        success: registry_parsing,
    });
}
/* Dynamic top menu positioning

var num = 100; //number of pixels before modifying styles
var nav = $('.navigation');
$(window).bind('scroll', function () {
    if ($(window).scrollTop() > num) {
       nav.addClass('fixed');
    } else {
        nav.removeClass('fixed');
    }
});*/

var json;
function registry_parsing(sensor_json) {
    json = sensor_json;
    console.log(json);
    $('#sensor_list').empty();

    for (var i = 0; i < json.sensor_list.length; i++) {
        if (json.sensor_list[i].availability == true) {
            var sensor = json.sensor_list[i];

            var tag_icon = "<span class='icon col-sm-2'><img width='20px' src='" + sensor.icon + "'></img></span>";
            var tag_title = "<span class='title col-md-2'><h3>" + sensor.title + "</h3></span>";
            var tag_description = "<span class='description col-md-12'>" + sensor.description + "</span>";
            var tag_subscribe = "<span class='subscribe col-sm-4'><button class='subscribe btn btn-primary' data-toggle='tooltip' data-placement='bottom' type='button' style='margin-top:10px' id='" + sensor.id + "'>Subscribe</button><div class='sla'>" + sensor.sla + "</div></span>";


            //check availability of preview if yes then sho preview if not substitude to tag_preview to tag_icon
            if (sensor.preview != '') {
                //Button that triggers modal
                var tag_get_preview = "<span class='preview col-sm-4'><button type='button' class='preview btn btn-primary' data-toggle='modal' data-target='#myModal' style='margin-top:10px'>Preview</button></span>";
                var tag_preview = "<span class='col-sm-4' width='20px' src='" + sensor.preview + "'></span>";
                var tag_sensor = "<div class='sensor col-md-4' id='" + sensor.id + "'><div class='row'>" + tag_title + tag_description + "</div><div class='row'>" + tag_subscribe + tag_get_preview + "</div></div>";

            } else {
                var tag_icon = "<span class='icon col-sm-2'><img width='20px' src='" + sensor.icon + "'></img></span>";
                var tag_sensor = "<div class='sensor col-md-4' id='" + sensor.id + "'><div class='row'>" + tag_icon + tag_title + tag_description + "</div><div class='row'>" + tag_subscribe + "</div></div>";

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
    //accept SLA in alert window
    $('.subscribe>button').click(function () {
        var sla = $(this).nextAll('div.sla').text();
        var result = confirm(sla); //put SLA text there
        if (result == true) {

            $(this).removeClass('btn-primary').addClass('btn-success').text('Subscribed');
            $('div.graph').show();
        }
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