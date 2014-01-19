  //self-defined anonymous function instead of onLoad()
    (function(){
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

    for (var i=0; i < json.sensor_list.length; i++) {
      if (json.sensor_list[i].availability == true){
          var sensor = json.sensor_list[i];

          var tag_title = "<span class='title'><h4>" + sensor.title + "</h4></span>";
          var tag_description = "<div class='description'>" + sensor.description + "</div>";
          var tag_icon = "<span class='icon'><img width='20px' src='" + sensor.icon + "'></img></span>";
          var tag_subscribe = "<span class='subscribe'><button type='button'>Subscribe</button><div class='sla'>" + sensor.sla + "</div></span>";
          var tag_sensor = "<div class='sensor' id='" + sensor.id + "'>" + tag_title + tag_description + "</div>"
          $('.sensor_list').append(tag_sensor);
          $('.image').append(tag_icon);
          $('.subscr_button').append(tag_subscribe);
       }
    };
    //accept SLA in alert window
    $('.subscribe>button').click(function(){
      var sla = $(this).next().text();
      var result = confirm(sla); //put SLA text there
       if (result == true){
        alert("Successfuly subscribed");
        $('div.graph').show();
       }
    });
  //Sign In button click and go to the sensor list
  $('button:submit').click(function(){
    $('form.form-signin').hide();
    $('div.content').show();
    return false;
  });
  }
