Box.Application.addModule('cabinet', function(context) {
  'use strict';

  var module_el;

  function primary_med_name() {
    return $(module_el).find('.pill-container .active').find('.pill-name').text() ||
            $(module_el).find('.pill-container').first().find('.pill-name').text();
  }

  function get_information(name) {
    return $.ajax({
      url: '/information',
      method: 'POST',
      data: { primary_name: name },
      dataType: 'json'
    });
  }

  function add_to_cabinet(name) {
    return $.ajax({
      url: '/add_to_cabinet',
      method: 'POST',
      dataType: 'json',
      data: { medicine: name }
    });
  }

  function refresh_shelves() {
    return $.ajax({
      url: '/refresh_shelves',
      method: 'GET',
      dataType: 'html'
    });
  }

  function delete_medicine(name, primary_med_name) {
    return $.ajax({
      url: '/destroy/',
      method: 'DELETE',
      data: { medicine: name, primary_name: primary_med_name },
      success: function(primary_medicine_info) {
        context.broadcast('reload_data', primary_medicine_info);
        refresh_shelves().done(function(data) {
          $(module_el).html(data);
          activate_primary_med(primary_medicine_info);
        });
      }
    });
  }

  function activate_primary_med(primary_medicine_info) {
    var primary = $(module_el).find(':contains("' + primary_medicine_info.primary + '")').closest('.pill-container');
    if(!primary) { return; }
    make_primary(primary, primary_medicine_info);
  }

  function set_interaction_count(primary_medicine_info) {
    var count = Object.keys(primary_medicine_info.interactions).length;
    $("div.pill-container.active").find('span').first().data("interactions", count);
  }

  function make_primary(elm, primary_medicine_info) {
    $(elm).removeClass('disabled interact').addClass('active');
    $(module_el).find('.pill-container').not($(elm)).removeClass('active interact').addClass('disabled');
    $(module_el).find('.pill-container').filter(function() {
      return $.inArray($(this).text().trim(), Object.keys(primary_medicine_info.interactions)) >= 0;
    }).toggleClass('interact disabled');
  }

  function click_primary(elm) {
    var name = $(elm).find('.pill-name').text();
    get_information(name).done(function(primary_medicine_info) {
      context.broadcast('reload_data', primary_medicine_info);
      refresh_shelves().done(function(data) {
        $(module_el).html(data);
        activate_primary_med(primary_medicine_info);
      });
    });
  }

  return {
    messages: ['medicine_added'],
    behaviors: [ 'navigation' ],

    init: function() {
      module_el = context.getElement();
      get_information('').done(function(primary_medicine_info) {
        context.broadcast('reload_data', primary_medicine_info);
        refresh_shelves().done(function(data) {
          $(module_el).html(data);
          activate_primary_med(primary_medicine_info);
          set_interaction_count(primary_medicine_info);
        });
      });
    },

    onmessage: function (name, medicine_name) {
      add_to_cabinet(medicine_name).done(function(primary_medicine_info) {
        context.broadcast('reload_data', primary_medicine_info);
        refresh_shelves().done(function(data) {
          $(module_el).html(data);
          activate_primary_med(primary_medicine_info);
          set_interaction_count(primary_medicine_info);
        });
      });
    },

    onclick: function(event, element, elementType) {
      event.preventDefault();
      var ev_target = $(event.target);
      if ($(ev_target).hasClass('pill-delete')) {
        var name = $(ev_target).closest('.pill-container').find('.pill-name').text();
        delete_medicine(name, primary_med_name());
      } else if ($(ev_target).closest('.pill-container')) {
        click_primary($(ev_target).closest('.pill-container')[0]);
      }
    }
  }
});
