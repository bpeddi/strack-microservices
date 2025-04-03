package com.simplytrack.strack_trade_service.controller;

import com.simplytrack.strack_trade_service.repository.TradeRepository;
// import com.simplytrack.strack_trade_service.config.JwtTokenUtil;
import com.simplytrack.strack_trade_service.entity.Trade;
// import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trades")
public class TradeController {


    // @Autowired
    // private JwtTokenUtil jwtTokenUtil;

    private final TradeRepository tradeRepository;

    public TradeController(TradeRepository tradeRepository) {
        this.tradeRepository = tradeRepository;
    }

    @PostMapping
    public ResponseEntity<Trade> createTrade(@RequestBody Trade tradeRequest, Authentication authentication) {
        String userId = authentication.getName();
        System.out.println("I am in create trade");
        // String userId2 = jwtTokenUtil.getUsernameFromToken()

        tradeRequest.setUserId(userId);
        Trade savedTrade = tradeRepository.save(tradeRequest);
        return ResponseEntity.ok(savedTrade);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<Trade>> createBatchTrades(@RequestBody List<Trade> trades, Authentication authentication) {
        String userId = authentication.getName();
        trades.forEach(trade -> trade.setUserId(userId));
        List<Trade> savedTrades = tradeRepository.saveAll(trades);
        return ResponseEntity.ok(savedTrades);
    }

    @GetMapping
    public ResponseEntity<List<Trade>> getTradesByUser(Authentication authentication) {
        String userId = authentication.getName();
        List<Trade> trades = tradeRepository.findByUserId(userId);
        return ResponseEntity.ok(trades);
    }
}