// ==UserScript==
// @name         Fotbalunas Hrac Kola
// @namespace    Fotbalunas Hrac Kola
// @version      0.1
// @description  try to take over the world!
// @namespace    https://github.com/dave-cz/fotbalunasVoter/
// @downloadURL  https://raw.githubusercontent.com/dave-cz/fotbalunasVoter/master/fotbalunasVoter.user.js
// @updateURL    https://raw.githubusercontent.com/dave-cz/fotbalunasVoter/master/fotbalunasVoter.user.js
// @author       https://github.com/dave-cz
// @match        http://fotbalunas.cz/sestava-kola/*
// @require      http://code.jquery.com/jquery-latest.min.js
// @require      https://raw.githubusercontent.com/bunkat/later/master/later.min.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    var sks = {
        enableVoting: true,
        hracId: null,
        sestavaId: null,
        worker: null,
        sched: later.parse.text('every 1 h'),
        klub: true
    };

    $('h4.text-center').append('<br/><br/><input id="votingCheckbox" type="checkbox" name="enableVoting" value="1" checked>'+
        '&nbsp;&nbsp;<span style="color:red;">Kliknutím na hráče zapnout automatické hlasování po hodině.</span><br/>'+
        'Funguje pouze pro přihlášené uživatele.<br/><br/><strong>Status:</strong> <span id="votingStatus" style="color:blue;"></span>');

    $('#votingCheckbox').click(function() {
        sks.enableVoting = $(this).is(':checked');
        if (sks.enableVoting && sks.hracId) {
            sks.startWorker();
        } else {
            sks.stopWorker();
        }
    });

    $('.sestava-kola-hrac-hlasuj').click(function() {
        sks.hracId = $(this).attr('data-hrac-id');
        sks.sestavaId = $(this).attr('data-sestava-kola-id');
        var klubHref = $(this).parent('.sestava-kola-hrac').children('.sestava-kola-hrac-klub').children('a').attr('href');
        if (klubHref.indexOf('1177') >= 0) {
            sks.startWorker();
            $('#votingStatus').text('Automatické hlasování zapnuto.');
        } else {
            sks.klub = false;
            $('#votingStatus').text('Hráč nehraje za kvalitní tým.');
        }
    });

    sks.startWorker = function () {
        var self = this; // self === sks
        this.worker = later.setInterval(function () {
            self.vote();
        }, this.sched);
    };

    sks.stopWorker = function () {
        if(!this.worker) {
            return;
        }
        if(typeof this.worker.clear === 'function') {
            this.worker.clear();
        }
        delete this.worker;
    };

    sks.vote = function() {
        var self = this;
        $.ajax({
            url: 'http://fotbalunas.cz/hlasuj-pro-hrace-kola/',
            type: 'post',
            data: {
                'hrac-id': self.hracId,
                'sestava-kola-id': self.sestavaId
            }
        }).done(function (response, textStatus, jqXHR){
            var res = JSON.parse(response);
            if (res.success) {
                $('#votingStatus').text('Naposled úspěšně zahlasováno: '+new Date().toLocaleFormat());
            } else {
                $('#votingStatus').text('Něco selhalo, zkus obnovit stránku.');
            }
        }).fail(function (jqXHR, textStatus, errorThrown){

            sks.stopWorker();
            $('#votingStatus').text('Něco selhalo, zkus obnovit stránku.');

            console.error("The following error occured: " +
                textStatus, errorThrown
            );
            console.log(jqXHR);
            var alert = (jqXHR.status > 205) ?
                jqXHR.responseText :
                ('AJAX: '+jqXHR.status + ' ' +jqXHR.statusText);
            console.log(alert);
        });
    };
})();
