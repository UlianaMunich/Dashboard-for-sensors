//self-defined anonymous function instead of onLoad()
(function () {
    //Sign In button click and go to the sensor list with prevented Default()

    $('form.form-signin').submit(function (event) {
        console.log('Handler for .submit() called.');
        event.preventDefault();
    });

    $('button:submit').click(function () {
        $('form.form-signin').hide();
        $('div.content').show();
    });
    $.ajax({
        dataType: "JSON",
        url: "registry.txt",
        success: registry_parsing,
    });
})();
//parsing of Registry data and creating html structure
var json;

function registry_parsing(sensor_json) {
    console.log(json);
    json = sensor_json;

    for (var i = 0; i < json.sensor_list.length; i++) {
        if (json.sensor_list[i].availability == true) {
            var sensor = json.sensor_list[i];

            var tag_icon = "<span class='icon col-sm-2'><img width='20px' src='" + sensor.icon + "'></img></span>";
            var tag_title = "<span class='title col-sm-6'>" + sensor.title + "</span>";
            var tag_description = "<div class='description col-sm-12'>" + sensor.description + "</div>";
            var tag_subscribe = "<span class='subscribe col-sm-4'><button type='button'>Subscribe</button><div class='sla'>" + sensor.sla + "</div></span>";
            // var tag_sensor = "<div class='sensor col-md-4' id='" + sensor.id + "'><div class='row'>" + tag_icon + tag_title 
            //+ tag_subscribe + "</div><div class='row'>" + tag_description + "</div></div>";

            //check availability of preview if yes then sho preview if not substitude to tag_preview to tag_icon
            if (sensor.preview == true) {
                //Button that triggers modal
                var tag_get_preview = "<span class='preview col-sm-4'><button type='button' class='btn btn-primary btn-lg' data-toggle='modal' data-target='#myModal'>Preview</button></span>";
                var tag_preview = "<span class='preview' col-sm-4'><img width='20px' src='" + sensor.preview + "'></img></span>";
                var tag_sensor = "<div class='sensor col-md-2' id='" + sensor.id + "'><div class='row'>" + tag_preview + tag_title + tag_subscribe + "</div><div class='row'>" + tag_description + "</div></div>";

            } else {
                var tag_icon = "<span class='icon col-sm-2'><img width='20px' src='" + sensor.icon + "'></img></span>";
                var tag_sensor = "<div class='sensor col-md-4' id='" + sensor.id + "'><div class='row'>" + tag_icon + tag_title + tag_subscribe + "</div><div class='row'>" + tag_description + "</div></div>";

            }
            $('#sensor_list').append(tag_sensor);
        }
    };
    //accept SLA in alert window
    $('.subscribe>button').click(function () {
        var sla = $(this).next().text();
        var result = confirm(sla); //put SLA text there
        if (result == true) {
            alert("Successfuly subscribed");
            $('div.graph').show();
        }
    });
    //update sensor list by clicking on Sensor List in nav.bar
    //$('#update_list').click(getRegistryList());
}